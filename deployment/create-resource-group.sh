#!/usr/bin/env bash
# This script sets up a Resource Group.

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

echo "Creating Resource Group with name \"$RESOURCE_GROUP_NAME\" in \"$RESOURCE_LOCATTION\"."
az group create \
  --location $RESOURCE_LOCATTION \
  --name $RESOURCE_GROUP_NAME
