#!/usr/bin/env bash
# This script sets up a Cosmos DB instance, and fetches the connection string.

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

echo "Creating Cosmos Account with name \"$COSMOS_ACCOUNT_NAME\" in \"$RESOURCE_LOCATTION\"."
az cosmosdb create \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --kind MongoDB \
  --enable-public-network true \
  --enable-free-tier true
