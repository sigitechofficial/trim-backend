#!/bin/sh
# Step 5 of the AWS setup: a shared network folder (EFS) for Trim's uploaded
# images, mounted into the container at /app/Public, the same folder the app
# writes to on cPanel today. Only creates new things; deletes nothing.
#
# - encrypted, in the two private subnets (reachable only inside the Trim VPC,
#   and only from the backend container's firewall)
# - access point: the container sees one folder (/trim-public) owned by the
#   container's user (uid/gid 1000 = "node"), never the whole share
# - automatic daily backups (AWS Backup)
# - elastic throughput: pay per GB read/written, never slowed down
#
# Cost: about $0.33/GB stored (450 MB = about $0.15) plus a few cents per GB
# served, plus backup storage. Well under $1 a month at Trim's size.
set -eu
export AWS_PROFILE=trim AWS_REGION=eu-west-2
. "$(dirname "$0")/ids.env"

# The creation token makes this safe to re-run: AWS refuses a second share
# with the same token instead of making a duplicate.
EFS=$(aws efs create-file-system --creation-token trim-aws-public \
  --encrypted --performance-mode generalPurpose --throughput-mode elastic \
  --backup \
  --tags Key=Name,Value=trim-aws-public Key=project,Value=trim-aws \
  --query FileSystemId --output text)
echo "EFS=$EFS"

until [ "$(aws efs describe-file-systems --file-system-id "$EFS" \
  --query 'FileSystems[0].LifeCycleState' --output text)" = available ]; do sleep 3; done

for SUBNET in "$PRIV_A" "$PRIV_B"; do
  aws efs create-mount-target --file-system-id "$EFS" --subnet-id "$SUBNET" \
    --security-groups "$SG_EFS" --query MountTargetId --output text
done

AP=$(aws efs create-access-point --file-system-id "$EFS" \
  --posix-user Uid=1000,Gid=1000 \
  --root-directory 'Path=/trim-public,CreationInfo={OwnerUid=1000,OwnerGid=1000,Permissions=755}' \
  --tags Key=Name,Value=trim-aws-public-ap Key=project,Value=trim-aws \
  --query AccessPointId --output text)
echo "EFS_AP=$AP"

echo "Waiting for the two mount points to be ready..."
until [ "$(aws efs describe-mount-targets --file-system-id "$EFS" \
  --query "length(MountTargets[?LifeCycleState=='available'])" --output text)" = 2 ]; do sleep 5; done
echo "done"
