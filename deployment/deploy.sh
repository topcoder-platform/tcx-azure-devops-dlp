#!/bin/bash -x
set -e

#########
### VARIABLE SECTION
### Edit variables below to alter the behaviour of the script
#########

# Location of all the resources
# Use "az account list-locations" to get the proper location
RESOURCE_LOCATTION="westus2"

# Resource Group Config
RESOURCE_GROUP_NAME="prod-tcx_ado_dlp_rg"

# CosmosDB config
COSMOS_ACCOUNT_NAME="prod-tcx-ado-dlp-cosmos-account"

# AKS Config
AKS_CLUSTER_NAME="prod-tcx-ado-dlp-cluster"
AKS_NODE_COUNT=2

# Storage Account Config
STORAGE_ACCOUNT_NAME="prodtcxdlpstorage"

# Function App Config
FUNCTION_APP_NAME="prod-tcx-ado-dlp-function"

#########
### LOGIC SECTION
#########

# Setup a Resource Group
function setupResourceGroup () {
  echo "Creating Resource Group with name \"$RESOURCE_GROUP_NAME\" in \"$RESOURCE_LOCATTION\"."
  az group create \
    --location $RESOURCE_LOCATTION \
    --name $RESOURCE_GROUP_NAME
}

# Setup a Cosmos Account
function setupCosmos () {
  echo "Creating Cosmos Account with name \"$COSMOS_ACCOUNT_NAME\" in \"$RESOURCE_LOCATTION\"."
  # Create CosmosDB Account
  az cosmosdb create \
    --name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --kind MongoDB \
    --enable-public-network true \
    --enable-free-tier true
  # Fetch the connection string
  COSMOS_CONNECTION_STRING=$(az cosmosdb keys list --type connection-strings \
    --name $COSMOS_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query 'connectionStrings[0].connectionString' \
    --output tsv
  )
}

# Setup AKS cluster
function setupAKS () {
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
}

# Installs NGINX into K8s Cluster
function installNginx () {
  echo "Installing NGINX to the K8s cluster."
  # Add Helm Repo
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  # Install NGINX
  helm install nginx-ingress ingress-nginx/ingress-nginx \
    --kube-context $AKS_CLUSTER_NAME \
    --namespace ingress-basic \
    --create-namespace \
    --set controller.replicaCount=2 \
    --set controller.nodeSelector."beta\.kubernetes\.io/os"=linux \
    --set defaultBackend.nodeSelector."beta\.kubernetes\.io/os"=linux \
    --set controller.admissionWebhooks.patch.nodeSelector."beta\.kubernetes\.io/os"=linux \
    --wait || true
}

# Install Presidio to the K8s cluster
function installRedis () {
  echo "Installing Redis to the K8s cluster."
  helm install redis stable/redis \
    --kube-context $AKS_CLUSTER_NAME \
    --namespace presidio-system \
    --create-namespace \
    --set rbac.create=true \
    --set usePassword=false \
    --wait || true
}

# Install Presidio to the K8s cluster
function setupPresidio () {
  # Clone the repo
  echo "Cloning the presidio repo"
  if [ -d presidio ]; then
    rm -rf presidio;
  fi;
  git clone git@github.com:microsoft/presidio.git
  pushd presidio/charts/presidio
  # Update Chart to use with Helm 3
  echo "Altering Presidio's Helm chart to use it with Helm 3"
  sed -i -e 's/v1/v2/g' Chart.yaml
  # Install Presidio
  echo "Installing Presidio to the K8s cluster"
  helm install presidio . \
    --kube-context $AKS_CLUSTER_NAME \
    --namespace presidio \
    --create-namespace \
    --set api.ingress.enabled=true \
    --set api.ingress.class=nginx \
    --wait || true
  # Fetch the IP Address for the service
  PRESIDIO_IP=$(
    kubectl get services nginx-ingress-ingress-nginx-controller \
      --namespace ingress-basic  \
      --output jsonpath='{.status.loadBalancer.ingress[0].ip}' \
      --context $AKS_CLUSTER_NAME
  )
  # Cleanup
  echo "Cleaning up Presidio setup"
  popd
  rm -rf presidio

}

function setupFunction () {
  echo "Creating Storage Account (to be used by Azure Functions App)"
  # Create a Storage Account to be used by the Function App
  az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --sku Standard_LRS
  echo "Creating Functions App"
  # Create a Function App 
  az functionapp create \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --storage-account $STORAGE_ACCOUNT_NAME \
    --consumption-plan-location $RESOURCE_LOCATTION \
    --os-type Windows \
    --runtime node \
    --functions-version 3
  echo "Configuring Functions App"
  # Configure the app
  az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --output none \
    --settings "MONGO_SSL=true"
  az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --output none \
    --settings "PRESIDIO_ENDPOINT=http://$PRESIDIO_IP/api/v1/projects/1/analyze"
  az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --output none \
    --settings "COSMOS_MONGO_CONNECTION_STRING=$COSMOS_CONNECTION_STRING"
  # Deploy the source code
  pushd ../
  echo "Deploying the function app"
  npm i
  npm run build
  func azure functionapp publish $FUNCTION_APP_NAME --node
  az functionapp cors remove -g $RESOURCE_GROUP_NAME -n $FUNCTION_APP_NAME --allowed-origins
  az functionapp cors add -g $RESOURCE_GROUP_NAME -n $FUNCTION_APP_NAME --allowed-origins '*'
  popd
}

#########
### EXECUTION SECTION
#########

pushd "$(dirname "${BASH_SOURCE[0]}")"

setupResourceGroup
setupCosmos
setupAKS
installNginx
installRedis
setupPresidio
setupFunction

popd
