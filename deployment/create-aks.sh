#!/usr/bin/env bash
# This script sets up an AKS cluster.

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

echo "Creating AKS cluster with name \"$AKS_CLUSTER_NAME\" in \"$RESOURCE_LOCATTION\""
# Create AKS Cluster
az aks create \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $AKS_CLUSTER_NAME \
  --node-count $AKS_NODE_COUNT \
  --location $RESOURCE_LOCATTION \
  --enable-managed-identity \
  --load-balancer-sku basic \
  --max-pods 100
# Get credentials to use kubectl
az aks get-credentials \
  --name $AKS_CLUSTER_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --overwrite-existing
