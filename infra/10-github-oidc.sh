#!/bin/sh
# Step 10 of the AWS setup: let GitHub Actions deploy Trim to AWS without any
# stored password or key (OIDC). GitHub proves "I am a workflow of
# sigitechofficial/trim-backend on branch X", AWS checks it and hands out a
# short-lived login for one role that can only:
#   - push images to the trim-backend ECR repository
#   - register a task definition and update the trim-aws-backend service
#   - pass the two Trim task roles to ECS (nothing else)
# Allowed branches: aws-deploy (push = deploy) and main (for later).
# Creates: the GitHub OIDC provider in IAM and the deploy role. Cost: free.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
ACCOUNT=680259118187
ROLE=trim-aws-github-deploy
REPO=sigitechofficial/trim-backend
PROVIDER=arn:aws:iam::$ACCOUNT:oidc-provider/token.actions.githubusercontent.com

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com --tags Key=project,Value=trim-aws >/dev/null
  echo "GitHub OIDC provider created"
fi

TRUST="{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": {\"Federated\": \"$PROVIDER\"},
    \"Action\": \"sts:AssumeRoleWithWebIdentity\",
    \"Condition\": {
      \"StringEquals\": {\"token.actions.githubusercontent.com:aud\": \"sts.amazonaws.com\"},
      \"StringLike\": {\"token.actions.githubusercontent.com:sub\": [
        \"repo:$REPO:ref:refs/heads/aws-deploy\",
        \"repo:$REPO:ref:refs/heads/main\"]}
    }
  }]
}"
if aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
  aws iam update-assume-role-policy --role-name "$ROLE" --policy-document "$TRUST"
else
  aws iam create-role --role-name "$ROLE" --assume-role-policy-document "$TRUST" \
    --description "GitHub Actions deploys Trim to ECS (sigitechofficial/trim-backend)" \
    --max-session-duration 3600 --tags Key=project,Value=trim-aws >/dev/null
fi

aws iam put-role-policy --role-name "$ROLE" --policy-name trim-deploy --policy-document "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {\"Effect\": \"Allow\", \"Action\": \"ecr:GetAuthorizationToken\", \"Resource\": \"*\"},
    {\"Effect\": \"Allow\", \"Resource\": \"arn:aws:ecr:eu-west-2:$ACCOUNT:repository/trim-backend\",
     \"Action\": [\"ecr:BatchCheckLayerAvailability\", \"ecr:InitiateLayerUpload\",
                \"ecr:UploadLayerPart\", \"ecr:CompleteLayerUpload\", \"ecr:PutImage\",
                \"ecr:BatchGetImage\", \"ecr:GetDownloadUrlForLayer\", \"ecr:DescribeImages\"]},
    {\"Effect\": \"Allow\", \"Action\": [\"ecs:RegisterTaskDefinition\", \"ecs:DescribeTaskDefinition\"],
     \"Resource\": \"*\"},
    {\"Effect\": \"Allow\", \"Action\": [\"ecs:DescribeServices\", \"ecs:UpdateService\"],
     \"Resource\": \"arn:aws:ecs:eu-west-2:$ACCOUNT:service/trim-aws/trim-aws-backend\"},
    {\"Effect\": \"Allow\", \"Action\": \"iam:PassRole\",
     \"Resource\": [\"arn:aws:iam::$ACCOUNT:role/trim-aws-task-exec-role\",
                  \"arn:aws:iam::$ACCOUNT:role/trim-aws-task-role\"],
     \"Condition\": {\"StringEquals\": {\"iam:PassedToService\": \"ecs-tasks.amazonaws.com\"}}}
  ]}"
aws iam get-role --role-name "$ROLE" --query Role.Arn --output text
