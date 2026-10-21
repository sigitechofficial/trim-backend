#!/bin/sh
# Step 7 of the AWS setup: the load balancer (ALB), Trim's front door.
# For now it listens on plain HTTP at AWS's own address
# (trim-aws-alb-....eu-west-2.elb.amazonaws.com), like Azure's default URL.
# HTTPS on our own domain comes later, once the IONOS records exist.
#
#   internet ──HTTP 80──▶ ALB (public subnets) ──3000──▶ Trim container(s)
#
# - target group: where the ALB sends requests (the Fargate task's IP, port 3000)
# - health check: GET /app-config.json every 30 s; 2 good answers = healthy,
#   3 bad = unhealthy (ECS then replaces the container)
# - idle timeout 120 s so socket.io connections aren't cut too early
#
# Cost: about $19/month + a little per traffic unit + 2 public IPs (~$7).
# Only creates new things.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
. "$(dirname "$0")/ids.env"
TAGS="Key=project,Value=trim-aws"

TG=$(aws elbv2 create-target-group --name trim-aws-tg \
  --protocol HTTP --port 3000 --target-type ip --vpc-id "$VPC" \
  --health-check-protocol HTTP --health-check-path /app-config.json \
  --health-check-interval-seconds 30 --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 --tags "$TAGS" Key=Name,Value=trim-aws-tg \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 modify-target-group-attributes --target-group-arn "$TG" \
  --attributes Key=deregistration_delay.timeout_seconds,Value=30 >/dev/null
echo "TG_ARN=$TG"

ALB=$(aws elbv2 create-load-balancer --name trim-aws-alb \
  --type application --scheme internet-facing --ip-address-type ipv4 \
  --subnets "$PUB_A" "$PUB_B" --security-groups "$SG_ALB" \
  --tags "$TAGS" Key=Name,Value=trim-aws-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
aws elbv2 modify-load-balancer-attributes --load-balancer-arn "$ALB" --attributes \
  Key=idle_timeout.timeout_seconds,Value=120 \
  Key=routing.http.drop_invalid_header_fields.enabled,Value=true >/dev/null
echo "ALB_ARN=$ALB"

LISTENER=$(aws elbv2 create-listener --load-balancer-arn "$ALB" \
  --protocol HTTP --port 80 \
  --default-actions "Type=forward,TargetGroupArn=$TG" \
  --query 'Listeners[0].ListenerArn' --output text)
echo "LISTENER_HTTP_ARN=$LISTENER"

echo "Waiting for the load balancer to become active..."
aws elbv2 wait load-balancer-available --load-balancer-arns "$ALB"
DNS=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB" \
  --query 'LoadBalancers[0].DNSName' --output text)
echo "ALB_DNS=$DNS"
