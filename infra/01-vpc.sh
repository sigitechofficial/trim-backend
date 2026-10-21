#!/bin/sh
# Step 1 of the AWS setup: Trim's own network (VPC), separate from the default
# VPC where the cPanel server runs. Nothing here touches existing resources.
#
#   Trim VPC 10.20.0.0/16 (London)
#   ├─ public-a  10.20.0.0/24  eu-west-2a  load balancer, Fargate task
#   ├─ public-b  10.20.1.0/24  eu-west-2b  load balancer, Fargate task
#   ├─ private-a 10.20.10.0/24 eu-west-2a  database, file share (no internet)
#   └─ private-b 10.20.11.0/24 eu-west-2b  database, file share (no internet)
#
# Cost: VPC, subnets, internet gateway and route tables are free.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2

tags() { echo "ResourceType=$1,Tags=[{Key=Name,Value=$2},{Key=project,Value=trim-aws}]"; }

VPC=$(aws ec2 create-vpc --cidr-block 10.20.0.0/16 \
  --tag-specifications "$(tags vpc trim-aws-vpc)" --query Vpc.VpcId --output text)
aws ec2 wait vpc-available --vpc-ids "$VPC"
aws ec2 modify-vpc-attribute --vpc-id "$VPC" --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id "$VPC" --enable-dns-hostnames
echo "VPC $VPC"

IGW=$(aws ec2 create-internet-gateway \
  --tag-specifications "$(tags internet-gateway trim-aws-igw)" \
  --query InternetGateway.InternetGatewayId --output text)
aws ec2 attach-internet-gateway --internet-gateway-id "$IGW" --vpc-id "$VPC"
echo "Internet gateway $IGW"

subnet() { # name cidr zone
  aws ec2 create-subnet --vpc-id "$VPC" --cidr-block "$2" --availability-zone "$3" \
    --tag-specifications "$(tags subnet "$1")" --query Subnet.SubnetId --output text
}
PUB_A=$(subnet trim-aws-public-a 10.20.0.0/24 eu-west-2a)
PUB_B=$(subnet trim-aws-public-b 10.20.1.0/24 eu-west-2b)
PRIV_A=$(subnet trim-aws-private-a 10.20.10.0/24 eu-west-2a)
PRIV_B=$(subnet trim-aws-private-b 10.20.11.0/24 eu-west-2b)
echo "Subnets public $PUB_A $PUB_B, private $PRIV_A $PRIV_B"

# Public route table: internet traffic goes out through the internet gateway.
RT_PUB=$(aws ec2 create-route-table --vpc-id "$VPC" \
  --tag-specifications "$(tags route-table trim-aws-public-rt)" \
  --query RouteTable.RouteTableId --output text)
aws ec2 create-route --route-table-id "$RT_PUB" --destination-cidr-block 0.0.0.0/0 --gateway-id "$IGW" >/dev/null
aws ec2 associate-route-table --route-table-id "$RT_PUB" --subnet-id "$PUB_A" >/dev/null
aws ec2 associate-route-table --route-table-id "$RT_PUB" --subnet-id "$PUB_B" >/dev/null

# Private route table: only traffic inside the VPC, no way to the internet.
RT_PRIV=$(aws ec2 create-route-table --vpc-id "$VPC" \
  --tag-specifications "$(tags route-table trim-aws-private-rt)" \
  --query RouteTable.RouteTableId --output text)
aws ec2 associate-route-table --route-table-id "$RT_PRIV" --subnet-id "$PRIV_A" >/dev/null
aws ec2 associate-route-table --route-table-id "$RT_PRIV" --subnet-id "$PRIV_B" >/dev/null
echo "Route tables public $RT_PUB, private $RT_PRIV"
