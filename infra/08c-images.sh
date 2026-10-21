#!/bin/sh
# Step 8c of the AWS setup: copy the uploaded images (cPanel's Public folder,
# downloaded as a zip) into the EFS share the Trim container uses.
# EFS is private, so a one-off container inside the VPC does the copy:
# private S3 bucket → container (alpine) → EFS /trim-public.
#
#   ./infra/08c-images.sh ~/Downloads/Public.zip
#
# Existing files on EFS with the same name are overwritten (same images);
# nothing is deleted. Creates a temporary bucket, log group and task
# definition. Cost: cents.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
DIR=$(cd "$(dirname "$0")" && pwd)
. "$DIR/ids.env"
ZIP=${1:?Usage: 08c-images.sh <path to Public.zip>}
[ -s "$ZIP" ] || { echo "No such file or empty: $ZIP"; exit 1; }
unzip -tq "$ZIP" >/dev/null || { echo "The zip is damaged"; exit 1; }
EXPECTED=$(unzip -Z1 "$ZIP" | grep '^Public/' | grep -cv '/$')
export EFS EFS_AP EXPECTED

ACCOUNT=680259118187
BUCKET=trim-aws-images-import-$ACCOUNT
LOGS=/trim-aws/images-import
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "== 1. Private S3 bucket, upload ($(du -h "$ZIP" | cut -f1); takes a few minutes)"
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  aws s3api create-bucket --bucket "$BUCKET" \
    --create-bucket-configuration LocationConstraint=eu-west-2 >/dev/null
  aws s3api put-public-access-block --bucket "$BUCKET" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  aws s3api put-bucket-tagging --bucket "$BUCKET" --tagging 'TagSet=[{Key=project,Value=trim-aws}]'
fi
aws s3 cp "$ZIP" "s3://$BUCKET/Public.zip" --sse AES256 --only-show-errors
export ZIP_URL=$(aws s3 presign "s3://$BUCKET/Public.zip" --expires-in 7200)
echo "uploaded; $EXPECTED image files in the zip"

echo "== 2. Log group"
aws logs create-log-group --log-group-name "$LOGS" --tags project=trim-aws 2>/dev/null || true
aws logs put-retention-policy --log-group-name "$LOGS" --retention-in-days 30
export ROLE_ARN=$(aws iam get-role --role-name trim-aws-task-exec-role --query Role.Arn --output text)

echo "== 3. Copy task"
cat > "$WORK/copy.sh" <<'EOF'
set -e
apk add --no-cache -q curl unzip
curl -fsS "$ZIP_URL" -o /tmp/p.zip
mkdir -p /tmp/x
unzip -q -o /tmp/p.zip 'Public/*' -d /tmp/x
cp -R /tmp/x/Public/. /data/
echo "files on EFS: $(find /data -type f | wc -l) (zip had $EXPECTED)"
echo "size on EFS: $(du -sh /data | cut -f1)"
for d in /data/*/; do echo "  $(basename "$d"): $(find "$d" -type f | wc -l)"; done
EOF
python3 - "$WORK/copy.sh" > "$WORK/taskdef.json" <<'EOF'
import json, os, sys
print(json.dumps({
  "family": "trim-aws-images-import",
  "networkMode": "awsvpc", "requiresCompatibilities": ["FARGATE"],
  "cpu": "512", "memory": "1024", "executionRoleArn": os.environ["ROLE_ARN"],
  "tags": [{"key": "project", "value": "trim-aws"}],
  "volumes": [{"name": "trim-public", "efsVolumeConfiguration": {
      "fileSystemId": os.environ["EFS"], "transitEncryption": "ENABLED",
      "authorizationConfig": {"accessPointId": os.environ["EFS_AP"], "iam": "DISABLED"}}}],
  "containerDefinitions": [{
    "name": "copy", "image": "public.ecr.aws/docker/library/alpine:3.20", "essential": True,
    "entryPoint": ["sh", "-c"], "command": [open(sys.argv[1]).read()],
    "environment": [{"name": "ZIP_URL", "value": os.environ["ZIP_URL"]},
                    {"name": "EXPECTED", "value": os.environ["EXPECTED"]}],
    "mountPoints": [{"sourceVolume": "trim-public", "containerPath": "/data"}],
    "logConfiguration": {"logDriver": "awslogs", "options": {
      "awslogs-group": "/trim-aws/images-import", "awslogs-region": "eu-west-2",
      "awslogs-stream-prefix": "copy"}}
  }]
}))
EOF
TASKDEF=$(aws ecs register-task-definition --cli-input-json "file://$WORK/taskdef.json" \
  --query taskDefinition.taskDefinitionArn --output text)
echo "task definition $TASKDEF"

echo "== 4. Run the copy (inside the VPC)"
TASK=$(aws ecs run-task --cluster trim-aws --launch-type FARGATE --task-definition "$TASKDEF" \
  --network-configuration "awsvpcConfiguration={subnets=[$PUB_A],securityGroups=[$SG_APP],assignPublicIp=ENABLED}" \
  --query 'tasks[0].taskArn' --output text)
echo "task $TASK"
aws ecs wait tasks-stopped --cluster trim-aws --tasks "$TASK"
aws ecs describe-tasks --cluster trim-aws --tasks "$TASK" \
  --query 'tasks[0].[containers[0].exitCode,stoppedReason]' --output text
echo "== Copy log"
aws logs tail "$LOGS" --since 30m --format short
