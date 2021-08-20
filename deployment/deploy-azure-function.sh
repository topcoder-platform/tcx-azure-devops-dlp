#!/usr/bin/env bash
# This script creates a new Azure Function App, configures it and deploys the function code to it.

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

ANALYZER_HOST=""
while [ -z $ANALYZER_HOST ]; do
  echo "Waiting for end point..."
  ANALYZER_HOST=$(
    kubectl get services nginx-ingress-ingress-nginx-controller \
      --namespace ingress-basic  \
      --output jsonpath='{.status.loadBalancer.ingress[0].ip}' \
      --context $AKS_CLUSTER_NAME
  )
  [ -z "$ANALYZER_HOST" ] && sleep 5
done

PRESIDIO_ENDPOINT="https://${ANALYZER_HOST}/analyze"

COSMOS_CONNECTION_STRING=$(az cosmosdb keys list --type connection-strings \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --query 'connectionStrings[0].connectionString' \
  --output tsv
)

echo "Creating Storage Account (to be used by Azure Functions App)"
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --sku Standard_LRS

echo "Creating Functions App"
az functionapp create \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --storage-account $STORAGE_ACCOUNT_NAME \
  --consumption-plan-location $RESOURCE_LOCATTION \
  --os-type Windows \
  --runtime node \
  --functions-version 3

echo "Configuring Functions App"
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --output none \
  --settings "MONGO_SSL=true"
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --output none \
  --settings "PRESIDIO_ENDPOINT=${PRESIDIO_ENDPOINT}"
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --output none \
  --settings "COSMOS_MONGO_CONNECTION_STRING=${COSMOS_CONNECTION_STRING}"

echo "Deploying the function app"
pushd ../
npm i
npm run build
func azure functionapp publish $FUNCTION_APP_NAME --node
az functionapp cors remove -g $RESOURCE_GROUP_NAME -n $FUNCTION_APP_NAME --allowed-origins
az functionapp cors add -g $RESOURCE_GROUP_NAME -n $FUNCTION_APP_NAME --allowed-origins '*'
popd
