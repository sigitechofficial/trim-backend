#!/bin/sh
# Step 3 of the AWS setup: firewalls (security groups) inside the Trim VPC.
# Each layer only accepts traffic from the layer in front of it:
#
#   internet ──443/80──▶ load balancer ──3000──▶ Trim container
#                                                  ├──3306──▶ database (RDS)
#                                                  └──2049──▶ images share (EFS)
#
# Outbound traffic stays open (the app calls Stripe, Firebase, ZeptoMail...).
# Cost: free.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
. "$(dirname "$0")/ids.env"

sg() { # name description
  aws ec2 create-security-group --vpc-id "$VPC" --group-name "$1" --description "$2" \
    --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=$1},{Key=project,Value=trim-aws}]" \
    --query GroupId --output text
}
allow_from_sg() { # target-sg port source-sg
  aws ec2 authorize-security-group-ingress --group-id "$1" \
    --ip-permissions "IpProtocol=tcp,FromPort=$2,ToPort=$2,UserIdGroupPairs=[{GroupId=$3}]" >/dev/null
}

SG_ALB=$(sg trim-aws-alb-sg "Trim load balancer: HTTPS and HTTP from the internet")
SG_APP=$(sg trim-aws-app-sg "Trim backend container: only from the load balancer")
SG_DB=$(sg trim-aws-db-sg "Trim database: only from the backend container")
SG_EFS=$(sg trim-aws-efs-sg "Trim images share: only from the backend container")

for port in 443 80; do
  aws ec2 authorize-security-group-ingress --group-id "$SG_ALB" \
    --ip-permissions "IpProtocol=tcp,FromPort=$port,ToPort=$port,IpRanges=[{CidrIp=0.0.0.0/0,Description=internet}]" >/dev/null
done
allow_from_sg "$SG_APP" 3000 "$SG_ALB"
allow_from_sg "$SG_DB" 3306 "$SG_APP"
allow_from_sg "$SG_EFS" 2049 "$SG_APP"

echo "SG_ALB=$SG_ALB"
echo "SG_APP=$SG_APP"
echo "SG_DB=$SG_DB"
echo "SG_EFS=$SG_EFS"
