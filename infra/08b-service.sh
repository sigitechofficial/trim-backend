#!/bin/sh
# Step 8b of the AWS setup: run Trim on ECS Fargate behind the load balancer.
#
#   ECS service trim-aws-backend (1 copy, replaced automatically if it fails)
#   └─ task (0.5 vCPU, 1 GB)
#      ├─ app    trim-backend image, port 3000, /app/Public = EFS images share
#      └─ redis  sidecar the app reaches at 127.0.0.1:6379
#
# SAFE MODE (testing while cPanel is live): the container gets the real
# settings EXCEPT the ones that reach real people or money, so it can't send
# pushes, emails or payments, and the booking-request timer is off.
# Move day runs this again with SAFE_MODE=0.
#
#   IMAGE_TAG=998fdb1757bc ./infra/08b-service.sh
#
# Creates: task role (only for "ECS Exec" debugging), log group, task
# definition, ECS service. Deletes nothing. Cost: about $21 a month while
# the one task runs.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
DIR=$(cd "$(dirname "$0")" && pwd)
. "$DIR/ids.env"
: "${IMAGE_TAG:?Set IMAGE_TAG to the trim-backend image tag to run}"
export IMAGE_TAG ECR_REPO EFS EFS_AP SAFE_MODE="${SAFE_MODE:-1}"
ACCOUNT=680259118187
CLUSTER=trim-aws
SERVICE=trim-aws-backend
TASK_ROLE=trim-aws-task-role
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

aws ecr describe-images --repository-name trim-backend --image-ids imageTag="$IMAGE_TAG" \
  --query 'imageDetails[0].imageTags[0]' --output text >/dev/null
echo "image $ECR_REPO:$IMAGE_TAG found"

echo "== 1. Task role (lets us open a shell in the running container for debugging)"
if ! aws iam get-role --role-name "$TASK_ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$TASK_ROLE" --tags Key=project,Value=trim-aws \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam put-role-policy --role-name "$TASK_ROLE" --policy-name ecs-exec --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect": "Allow", "Resource": "*", "Action": [
      "ssmmessages:CreateControlChannel", "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel", "ssmmessages:OpenDataChannel"]}]}'
  sleep 10
fi
export EXEC_ROLE_ARN=$(aws iam get-role --role-name trim-aws-task-exec-role --query Role.Arn --output text)
export TASK_ROLE_ARN=$(aws iam get-role --role-name "$TASK_ROLE" --query Role.Arn --output text)

echo "== 2. Log group"
aws logs create-log-group --log-group-name /trim-aws/backend --tags project=trim-aws 2>/dev/null || true
aws logs put-retention-policy --log-group-name /trim-aws/backend --retention-in-days 30

echo "== 3. Task definition"
aws ssm get-parameters-by-path --path /trim/prod/ --query 'Parameters[].Name' --output text \
  | tr '\t' '\n' > "$WORK/names.txt"
python3 - "$WORK/names.txt" > "$WORK/taskdef.json" <<'EOF'
import json, os, sys
names = [n.strip() for n in open(sys.argv[1]) if n.strip()]
safe = os.environ["SAFE_MODE"] == "1"
# cPanel-only database logins and settings the code never reads.
never = {"DB_HOST_PROD", "DB_NAME_PROD", "DB_USERNAME_PROD", "DB_PASSWORD_PROD",
         "DB_LOGGING", "MYSQL_DATABASE", "MYSQL_PORT", "MYSQL_USER"}
# Safe mode: nothing that reaches real customers' phones, inboxes or money.
blocked = {"FIREBASE_JSON_B64", "FIREBASE_SERVER_KEY", "EMAIL_PASSWORD",
           "STRIPE_SECRET_KEY", "paypalClientSecret"} if safe else set()
secrets = []
for n in sorted(names):
    key = n.rsplit("/", 1)[1]
    if key in never or key in blocked:
        continue
    secrets.append({"name": key,
                    "valueFrom": "arn:aws:ssm:eu-west-2:680259118187:parameter" + n})
env = [{"name": "NODE_ENV", "value": "production"},
       {"name": "PORT", "value": "3000"},
       {"name": "PUBLISH_APEX_DEEPLINKS", "value": "false"}]
if safe:
    env.append({"name": "BOOKING_REQUEST_TIMER", "value": "off"})
print(json.dumps({
  "family": "trim-aws-backend",
  "networkMode": "awsvpc", "requiresCompatibilities": ["FARGATE"],
  "runtimePlatform": {"operatingSystemFamily": "LINUX", "cpuArchitecture": "X86_64"},
  "cpu": "512", "memory": "1024",
  "executionRoleArn": os.environ["EXEC_ROLE_ARN"],
  "taskRoleArn": os.environ["TASK_ROLE_ARN"],
  "tags": [{"key": "project", "value": "trim-aws"},
           {"key": "mode", "value": "safe" if safe else "live"}],
  "volumes": [{"name": "trim-public", "efsVolumeConfiguration": {
      "fileSystemId": os.environ["EFS"], "transitEncryption": "ENABLED",
      "authorizationConfig": {"accessPointId": os.environ["EFS_AP"], "iam": "DISABLED"}}}],
  "containerDefinitions": [
    {"name": "redis", "image": "public.ecr.aws/docker/library/redis:7.4-alpine",
     "essential": False, "memoryReservation": 64,
     "command": ["redis-server", "--save", "", "--appendonly", "no"],
     "logConfiguration": {"logDriver": "awslogs", "options": {
       "awslogs-group": "/trim-aws/backend", "awslogs-region": "eu-west-2",
       "awslogs-stream-prefix": "redis"}}},
    {"name": "app", "image": os.environ["ECR_REPO"] + ":" + os.environ["IMAGE_TAG"],
     "essential": True,
     "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
     "dependsOn": [{"containerName": "redis", "condition": "START"}],
     "environment": env, "secrets": secrets,
     "mountPoints": [{"sourceVolume": "trim-public", "containerPath": "/app/Public"}],
     "stopTimeout": 30,
     "logConfiguration": {"logDriver": "awslogs", "options": {
       "awslogs-group": "/trim-aws/backend", "awslogs-region": "eu-west-2",
       "awslogs-stream-prefix": "app"}}}]
}))
print("secrets given to the app: %d (safe mode: %s)" % (len(secrets), safe), file=sys.stderr)
EOF
TASKDEF=$(aws ecs register-task-definition --cli-input-json "file://$WORK/taskdef.json" \
  --query taskDefinition.taskDefinitionArn --output text)
echo "task definition $TASKDEF"

echo "== 4. Service"
if [ "$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
      --query 'services[0].status' --output text 2>/dev/null)" = ACTIVE ]; then
  aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
    --task-definition "$TASKDEF" --query service.status --output text
else
  aws ecs create-service --cluster "$CLUSTER" --service-name "$SERVICE" \
    --task-definition "$TASKDEF" --desired-count 1 --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[$PUB_A,$PUB_B],securityGroups=[$SG_APP],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=app,containerPort=3000" \
    --health-check-grace-period-seconds 90 \
    --deployment-configuration 'maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}' \
    --enable-execute-command --propagate-tags SERVICE \
    --tags key=project,value=trim-aws \
    --query service.status --output text
fi

echo "== 5. Waiting until the new task is running and healthy (a few minutes)..."
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
aws elbv2 describe-target-health --target-group-arn "$TG_ARN" \
  --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State]' --output text
