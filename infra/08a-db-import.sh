#!/bin/sh
# Step 8a of the AWS setup: copy a phpMyAdmin export into the RDS database and
# create the app's own database user. RDS is private, so a one-off container
# (mariadb:10.11) runs inside the Trim VPC, downloads the dump from a private
# S3 bucket, imports it, creates the user, prints table/row counts and stops.
#
#   ./infra/08a-db-import.sh ~/Downloads/trimworldwide_prod.sql
#
# Passwords are never printed: the admin password comes from Secrets Manager
# (RDS keeps it there), the app password is generated straight into Parameter
# Store, and ECS hands both to the container as secrets.
# Creates: S3 bucket (temporary), IAM execution role, log group, ECS cluster,
# app DB settings in Parameter Store, a task definition. Deletes nothing.
# Cost: cents (a few minutes of Fargate, a few MB in S3).
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
DIR=$(cd "$(dirname "$0")" && pwd)
. "$DIR/ids.env"
export DB_ENDPOINT DB_ADMIN_SECRET_ARN DB_NAME
DUMP=${1:?Usage: 08a-db-import.sh <path to the .sql export>}
[ -s "$DUMP" ] || { echo "No such file or empty: $DUMP"; exit 1; }

ACCOUNT=680259118187
BUCKET=trim-aws-dbimport-$ACCOUNT
ROLE=trim-aws-task-exec-role
CLUSTER=trim-aws
LOGS=/trim-aws/db-import
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "== 1. Private S3 bucket for the dump"
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$BUCKET" \
    --create-bucket-configuration LocationConstraint=eu-west-2 >/dev/null
  aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging 'TagSet=[{Key=project,Value=trim-aws}]'
fi
aws s3 cp "$DUMP" "s3://$BUCKET/import.sql" --sse AES256 --only-show-errors
export DUMP_URL=$(aws s3 presign "s3://$BUCKET/import.sql" --expires-in 3600)
echo "uploaded; download link valid for 1 hour"

echo "== 2. Execution role (lets ECS pull images, write logs, read Trim secrets)"
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam create-role --role-name "$ROLE" --tags Key=project,Value=trim-aws \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null
  aws iam attach-role-policy --role-name "$ROLE" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
  sleep 10   # a new role takes a few seconds before ECS can use it
fi
aws iam put-role-policy --role-name "$ROLE" --policy-name trim-secrets-read --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {\"Effect\": \"Allow\", \"Action\": [\"ssm:GetParameters\"],
     \"Resource\": \"arn:aws:ssm:eu-west-2:$ACCOUNT:parameter/trim/prod/*\"},
    {\"Effect\": \"Allow\", \"Action\": [\"secretsmanager:GetSecretValue\"],
     \"Resource\": \"$DB_ADMIN_SECRET_ARN\"}
  ]}"
export ROLE_ARN=$(aws iam get-role --role-name "$ROLE" --query Role.Arn --output text)

echo "== 3. Log group and ECS cluster"
aws logs create-log-group --log-group-name "$LOGS" --tags project=trim-aws 2>/dev/null || true
aws logs put-retention-policy --log-group-name "$LOGS" --retention-in-days 30
aws ecs create-cluster --cluster-name "$CLUSTER" --tags key=project,value=trim-aws \
  --query cluster.status --output text

echo "== 4. App database settings in Parameter Store"
python3 - "$WORK" <<'EOF'
import json, os, secrets, subprocess, sys
work = sys.argv[1]
def exists(name):
    return subprocess.run(["aws", "ssm", "get-parameter", "--name", name],
                          capture_output=True).returncode == 0
def put(name, value, typ):
    path = os.path.join(work, "p.json")
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump({"Name": name, "Value": value, "Type": typ, "Overwrite": True}, f)
    try:
        subprocess.run(["aws", "ssm", "put-parameter", "--cli-input-json", "file://" + path],
                       check=True, stdout=subprocess.DEVNULL)
    finally:
        os.remove(path)
put("/trim/prod/DB_HOST", os.environ["DB_ENDPOINT"], "String")
put("/trim/prod/DB_USER", "trim_app", "String")
put("/trim/prod/DB_NAME", os.environ["DB_NAME"], "String")
if not exists("/trim/prod/DB_PASSWORD"):   # letters, digits, - and _ only
    put("/trim/prod/DB_PASSWORD", secrets.token_urlsafe(32), "SecureString")
print("DB_HOST, DB_USER, DB_NAME, DB_PASSWORD stored")
EOF

echo "== 5. Import task definition"
# What the container runs. Quoted heredoc: nothing here is expanded on the Mac.
cat > "$WORK/import.sh" <<'EOF'
set -e
apt-get update -qq >/dev/null
apt-get install -y -qq curl >/dev/null
curl -fsS "$DUMP_URL" -o /tmp/dump.sql
echo "dump bytes: $(wc -c < /tmp/dump.sql)"
export MYSQL_PWD="$ADMIN_PASSWORD"
mariadb -h "$DB_HOST" -u trimadmin --max-allowed-packet=256M trimworldwide_prod < /tmp/dump.sql
echo "import finished"
cat > /tmp/user.sql <<SQL
CREATE USER IF NOT EXISTS 'trim_app'@'%' IDENTIFIED BY '$APP_PASSWORD';
ALTER USER 'trim_app'@'%' IDENTIFIED BY '$APP_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES,
  CREATE TEMPORARY TABLES, LOCK TABLES ON trimworldwide_prod.* TO 'trim_app'@'%';
SQL
mariadb -h "$DB_HOST" -u trimadmin < /tmp/user.sql
rm -f /tmp/user.sql
echo "app user ready"
mariadb -h "$DB_HOST" -u trimadmin -N -e "
  SELECT CONCAT('tables: ', COUNT(*)) FROM information_schema.tables
   WHERE table_schema = 'trimworldwide_prod';
  SELECT CONCAT('rows ', table_name, ': ', table_rows) FROM information_schema.tables
   WHERE table_schema = 'trimworldwide_prod'
     AND table_name IN ('users', 'bookings', 'jobs', 'salonDetails', 'services')
   ORDER BY table_name;"
MYSQL_PWD="$APP_PASSWORD" mariadb -h "$DB_HOST" -u trim_app -N -e \
  "SELECT CONCAT('app user can read: ', COUNT(*), ' users') FROM trimworldwide_prod.users;"
EOF

python3 - "$WORK/import.sh" > "$WORK/taskdef.json" <<'EOF'
import json, os, sys
script = open(sys.argv[1]).read()
print(json.dumps({
  "family": "trim-aws-db-import",
  "networkMode": "awsvpc", "requiresCompatibilities": ["FARGATE"],
  "cpu": "512", "memory": "1024", "executionRoleArn": os.environ["ROLE_ARN"],
  "tags": [{"key": "project", "value": "trim-aws"}],
  "containerDefinitions": [{
    "name": "import", "image": "mariadb:10.11", "essential": True,
    "entryPoint": ["sh", "-c"], "command": [script],
    "environment": [
      {"name": "DB_HOST", "value": os.environ["DB_ENDPOINT"]},
      {"name": "DUMP_URL", "value": os.environ["DUMP_URL"]}],
    "secrets": [
      {"name": "ADMIN_PASSWORD", "valueFrom": os.environ["DB_ADMIN_SECRET_ARN"] + ":password::"},
      {"name": "APP_PASSWORD",
       "valueFrom": "arn:aws:ssm:eu-west-2:680259118187:parameter/trim/prod/DB_PASSWORD"}],
    "logConfiguration": {"logDriver": "awslogs", "options": {
      "awslogs-group": "/trim-aws/db-import", "awslogs-region": "eu-west-2",
      "awslogs-stream-prefix": "import"}}
  }]
}))
EOF
TASKDEF=$(aws ecs register-task-definition --cli-input-json "file://$WORK/taskdef.json" \
  --query taskDefinition.taskDefinitionArn --output text)
echo "task definition $TASKDEF"

echo "== 6. Run the import (inside the VPC)"
TASK=$(aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE --task-definition "$TASKDEF" \
  --network-configuration "awsvpcConfiguration={subnets=[$PUB_A],securityGroups=[$SG_APP],assignPublicIp=ENABLED}" \
  --query 'tasks[0].taskArn' --output text)
echo "task $TASK"
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK"
aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK" \
  --query 'tasks[0].[containers[0].exitCode,stoppedReason]' --output text
echo "== Import log"
aws logs tail "$LOGS" --since 30m --format short
