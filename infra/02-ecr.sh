#!/bin/sh
# Step 2 of the AWS setup: a private image store (ECR) for the Trim backend.
# Each deploy pushes one image, tagged with its git commit, and Fargate runs it.
#
# - Scan on push: AWS checks every image for libraries with known security holes.
# - Immutable tags: an image tag can't be overwritten, so a commit's image never
#   changes and rolling back to it always gives the same code.
# - Lifecycle: keep the newest 10 images, delete untagged leftovers after 1 day.
#
# Cost: about $0.10 per GB per month (each image is about 1 GB, compressed less).
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2

REPO=trim-backend

aws ecr create-repository --repository-name "$REPO" \
  --image-scanning-configuration scanOnPush=true \
  --image-tag-mutability IMMUTABLE \
  --encryption-configuration encryptionType=AES256 \
  --tags Key=project,Value=trim-aws \
  --query repository.repositoryUri --output text

aws ecr put-lifecycle-policy --repository-name "$REPO" --lifecycle-policy-text '{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Remove untagged images after 1 day",
      "selection": {"tagStatus": "untagged", "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 1},
      "action": {"type": "expire"}
    },
    {
      "rulePriority": 2,
      "description": "Keep the newest 10 images",
      "selection": {"tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 10},
      "action": {"type": "expire"}
    }
  ]
}' --query repositoryName --output text
