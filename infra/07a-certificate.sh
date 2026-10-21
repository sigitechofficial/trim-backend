#!/bin/sh
# Step 7a of the AWS setup: a free HTTPS certificate (ACM) for the load
# balancer, valid for the live name and a temporary test name.
# AWS issues it once the DNS check records it prints are added in IONOS.
# Those are new records only; no existing record changes. ACM renews it itself.
# Cost: free.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2

CERT=$(aws acm request-certificate \
  --domain-name backend.trimworldwide.com \
  --subject-alternative-names awsbackend.trimworldwide.com \
  --validation-method DNS \
  --idempotency-token trimawsbackend \
  --tags Key=Name,Value=trim-aws-backend Key=project,Value=trim-aws \
  --query CertificateArn --output text)
echo "CERT_ARN=$CERT"

# The DNS check records appear a few seconds after the request.
sleep 10
aws acm describe-certificate --certificate-arn "$CERT" \
  --query 'Certificate.DomainValidationOptions[].[DomainName,ResourceRecord.Type,ResourceRecord.Name,ResourceRecord.Value]' \
  --output text
