#!/bin/sh
# Step 4 of the AWS setup: Trim's database on RDS for MariaDB 10.11.19, the
# same engine and version as cPanel, in the private subnets (no internet).
#
# Settings copied from the cPanel MariaDB (checked 2026-10-21 in phpMyAdmin):
# time zone UTC, latin1 server charset, 256 MB max_allowed_packet, sql_mode.
#
# - db.t4g.micro (2 vCPU burst, 1 GB RAM), 20 GB gp3 disk, grows up to 50 GB
# - encrypted disk, daily backups kept 14 days (restore to any minute)
# - deletion protection on, not reachable from the internet
# - admin password created and kept by AWS in Secrets Manager (never shown here)
#
# Cost: about $13 instance + $2.6 disk + $0.40 secret = about $16 a month.
# Usage: SQL_MODE='<value of SELECT @@global.sql_mode on cPanel>' ./04-rds.sh
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
. "$(dirname "$0")/ids.env"
: "${SQL_MODE:?Set SQL_MODE to the cPanel value of @@global.sql_mode}"

TAGS="Key=project,Value=trim-aws"

aws rds create-db-subnet-group --db-subnet-group-name trim-aws-db-subnets \
  --db-subnet-group-description "Trim database: private subnets only" \
  --subnet-ids "$PRIV_A" "$PRIV_B" --tags "$TAGS" \
  --query DBSubnetGroup.DBSubnetGroupName --output text

aws rds create-db-parameter-group --db-parameter-group-name trim-aws-mariadb1011 \
  --db-parameter-group-family mariadb10.11 \
  --description "Trim: same settings as the cPanel MariaDB" --tags "$TAGS" \
  --query DBParameterGroup.DBParameterGroupName --output text

# sql_mode holds commas, so the parameters go in as JSON.
python3 - "$SQL_MODE" > /tmp/trim-rds-params.json <<'EOF'
import json, sys
p = lambda n, v: {"ParameterName": n, "ParameterValue": v, "ApplyMethod": "pending-reboot"}
print(json.dumps([
    p("time_zone", "UTC"),
    p("character_set_server", "latin1"),
    p("collation_server", "latin1_swedish_ci"),
    p("max_allowed_packet", "268435456"),
    p("sql_mode", sys.argv[1]),
]))
EOF
aws rds modify-db-parameter-group --db-parameter-group-name trim-aws-mariadb1011 \
  --parameters file:///tmp/trim-rds-params.json --output text
rm -f /tmp/trim-rds-params.json

aws rds create-db-instance \
  --db-instance-identifier trim-aws-db \
  --engine mariadb --engine-version 10.11.19 \
  --db-instance-class db.t4g.micro \
  --storage-type gp3 --allocated-storage 20 --max-allocated-storage 50 \
  --storage-encrypted \
  --db-name trimworldwide_prod \
  --master-username trimadmin --manage-master-user-password \
  --db-subnet-group-name trim-aws-db-subnets \
  --vpc-security-group-ids "$SG_DB" \
  --db-parameter-group-name trim-aws-mariadb1011 \
  --no-publicly-accessible --no-multi-az \
  --backup-retention-period 14 \
  --preferred-backup-window 01:00-02:00 \
  --preferred-maintenance-window sun:02:30-sun:03:30 \
  --copy-tags-to-snapshot --deletion-protection \
  --auto-minor-version-upgrade \
  --tags "$TAGS" Key=Name,Value=trim-aws-db \
  --query DBInstance.DBInstanceStatus --output text

echo "Creating; this takes about 10 minutes. Waiting until it is available..."
aws rds wait db-instance-available --db-instance-identifier trim-aws-db
aws rds describe-db-instances --db-instance-identifier trim-aws-db \
  --query 'DBInstances[0].[Endpoint.Address,MasterUserSecret.SecretArn]' --output text
