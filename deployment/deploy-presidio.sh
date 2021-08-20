#!/usr/bin/env bash
# This script deploys Presidio to the K8s cluster.

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

echo "Installing Presidio to the K8s cluster"
helm upgrade presidio \
  --set registry=mcr.microsoft.com,tag=latest \
  --kube-context $AKS_CLUSTER_NAME \
  --namespace presidio \
  --create-namespace \
  --wait \
  --install \
  ./charts/presidio || true
