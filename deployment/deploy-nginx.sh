#!/usr/bin/env bash
# This script installs NGINX to the AKS instance using Helm.

# Add Helm Repo
echo "Adding/Updating NGINX Helm Repo"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
# Install NGINX
echo "Installing NGINX to the K8s cluster."
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-basic \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."beta\.kubernetes\.io/os"=linux \
  --set defaultBackend.nodeSelector."beta\.kubernetes\.io/os"=linux \
  --set controller.admissionWebhooks.patch.nodeSelector."beta\.kubernetes\.io/os"=linux \
  --version="3.35.0" \
  --wait || true
