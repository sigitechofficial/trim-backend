#!/bin/sh
# Step 9 of the AWS setup: email alerts when Trim on AWS is in trouble, plus a
# monthly budget so the AWS bill can't grow unnoticed.
#
#   ALERT_EMAILS="a@example.com b@example.com" ./infra/09-alerts.sh
#
# Each address gets a "Subscription Confirmation" email from AWS first and
# only receives alerts after clicking "Confirm subscription" in it.
#
# Alarms (each emails once when it starts and again when it's OK):
#   backend down       no healthy Trim container behind the load balancer, 3 min
#   load balancer 5xx  the load balancer itself failing requests (502/503/504)
#   backend CPU/memory over 85% for 15 min
#   database CPU       over 80% for 15 min
#   database disk      under 2 GB free
#   database memory    under 64 MB free
# Budget (whole AWS account, which also runs cPanel: ~$135/month before Trim):
#   email at 80% of $250 spent, and when the month is forecast over $250.
# Cost: about $0.70/month (7 alarms at $0.10); email alerts and 1 budget are free.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
DIR=$(cd "$(dirname "$0")" && pwd)
. "$DIR/ids.env"
: "${ALERT_EMAILS:?Set ALERT_EMAILS to one or more email addresses}"
ACCOUNT=680259118187

TOPIC=$(aws sns create-topic --name trim-aws-alerts --tags Key=project,Value=trim-aws \
  --query TopicArn --output text)
echo "SNS topic $TOPIC"
for e in $ALERT_EMAILS; do
  aws sns subscribe --topic-arn "$TOPIC" --protocol email --notification-endpoint "$e" >/dev/null
  echo "confirmation email sent to $e"
done

ALB_DIM=$(echo "$ALB_ARN" | sed 's#.*:loadbalancer/##')     # app/trim-aws-alb/...
TG_DIM=$(echo "$TG_ARN" | sed 's#.*:##')                    # targetgroup/trim-aws-tg/...

alarm() { # missing name description namespace metric stat comparison threshold periods dims...
  # "missing" = what no data means: breaching (a problem) or notBreaching (fine).
  missing=$1 name=$2 desc=$3 ns=$4 metric=$5 stat=$6 cmp=$7 thr=$8 periods=$9; shift 9
  aws cloudwatch put-metric-alarm --alarm-name "$name" --alarm-description "$desc" \
    --namespace "$ns" --metric-name "$metric" --statistic "$stat" \
    --period 60 --evaluation-periods "$periods" --datapoints-to-alarm "$periods" \
    --threshold "$thr" --comparison-operator "$cmp" --treat-missing-data "$missing" \
    --dimensions "$@" --alarm-actions "$TOPIC" --ok-actions "$TOPIC" \
    --tags Key=project,Value=trim-aws
  echo "alarm $name"
}

alarm breaching trim-aws-backend-down "No healthy Trim container behind the load balancer for 3 minutes" \
  AWS/ApplicationELB HealthyHostCount Minimum LessThanThreshold 1 3 \
  Name=LoadBalancer,Value="$ALB_DIM" Name=TargetGroup,Value="$TG_DIM"
alarm notBreaching trim-aws-alb-5xx "The load balancer returned 5 or more 502/503/504 errors in a minute, 3 minutes running" \
  AWS/ApplicationELB HTTPCode_ELB_5XX_Count Sum GreaterThanOrEqualToThreshold 5 3 \
  Name=LoadBalancer,Value="$ALB_DIM"
alarm notBreaching trim-aws-backend-cpu "Trim container CPU over 85% for 15 minutes" \
  AWS/ECS CPUUtilization Average GreaterThanThreshold 85 15 \
  Name=ClusterName,Value=trim-aws Name=ServiceName,Value=trim-aws-backend
alarm notBreaching trim-aws-backend-memory "Trim container memory over 85% for 15 minutes" \
  AWS/ECS MemoryUtilization Average GreaterThanThreshold 85 15 \
  Name=ClusterName,Value=trim-aws Name=ServiceName,Value=trim-aws-backend
alarm notBreaching trim-aws-db-cpu "Database CPU over 80% for 15 minutes" \
  AWS/RDS CPUUtilization Average GreaterThanThreshold 80 15 \
  Name=DBInstanceIdentifier,Value=trim-aws-db
alarm notBreaching trim-aws-db-disk "Database has less than 2 GB of disk left" \
  AWS/RDS FreeStorageSpace Minimum LessThanThreshold 2147483648 5 \
  Name=DBInstanceIdentifier,Value=trim-aws-db
alarm notBreaching trim-aws-db-memory "Database has less than 64 MB of free memory for 15 minutes" \
  AWS/RDS FreeableMemory Minimum LessThanThreshold 67108864 15 \
  Name=DBInstanceIdentifier,Value=trim-aws-db

echo "== Monthly budget"
SUBS=$(for e in $ALERT_EMAILS; do printf '{"SubscriptionType":"EMAIL","Address":"%s"},' "$e"; done | sed 's/,$//')
aws budgets create-budget --account-id "$ACCOUNT" \
  --budget '{"BudgetName":"trim-aws-monthly","BudgetLimit":{"Amount":"250","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
  --notifications-with-subscribers "[
    {\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":80,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":[$SUBS]},
    {\"Notification\":{\"NotificationType\":\"FORECASTED\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":100,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":[$SUBS]}]"
echo "budget trim-aws-monthly (\$250, whole account) created"
