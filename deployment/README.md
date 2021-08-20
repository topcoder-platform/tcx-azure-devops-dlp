## DEPLOYMENT

The `deploy-all.sh` file is a bash script that automates the setting up of the Azure infrastructure and the configuration and deployment of the Azure function.

This script is tested on macOS Big Sur (11.1), and it has the following pre-requisites:

- [Helm 3](https://helm.sh/docs/intro/install/) installed and working on the local machine. accessible through $PATH.
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed, available through $PATH and logged in (use the `az login` command).
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed and available through $PATH.
- [Azure Functions Core Tools v3](https://www.npmjs.com/package/azure-functions-core-tools/v/3.0.3160): At the time of writing of this article, default is version 2, so be sure to install v3.

The variable section of the script is located at the top. Edit the variables under it to alter the behavior of the script.

## INFRASTRUCTURE

To develop this solution, I have used the following Azure resources

1. Function App
1. Azure Cosmos DB (with Mongo DB API) (Other MongoDB systems may also work)
1. Azure Kubernetes Service (other Kubernetes or a VM may also work)

### Virtual Network (Optional)

- This is required only if we want to hide everything other than the Function behind a private network.
- Link for setup: 

### Function App

- Link for setup: https://portal.azure.com/#create/Microsoft.FunctionApp
- If you need to use Private Networks (VNet), you must use the Premium Plan.
- Once the Function App has been created, install the VS Code extension to manage/deploy the DLP Function to the Function App: https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions.

### Azure Kubernetes Service

- Link for setup: https://portal.azure.com/#create/microsoft.aks
- I had trouble when Node count was less than two (memory issues). I'd recommend setting it to three.
- Using "System-assigned managed identity" as the authentication method is supposed to be the simpler and easier method.
- If using a private VNet, switch to Azure CNI as the method of "Network configuration", and configure the subnetting according to the VNet's configuration.
- Creation of a container registry (ACR) is not required.

### Presidio

- Once the AKS cluster has started up, download the Azure CLI and fetch the context for the cluster:
    ```sh
    az aks get-credentials --name tcx-azure-devops-dlp --resource-group DEV
    ```
- Download and install Helm 3 on your local machine.
- Install NGINX to the cluster (https://kubernetes.github.io/ingress-nginx/deploy/):
    ```sh
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm install nginx-ingress ingress-nginx/ingress-nginx \
      --namespace ingress-basic \
      --set controller.replicaCount=2 \
      --set controller.nodeSelector."beta\.kubernetes\.io/os"=linux \
      --set defaultBackend.nodeSelector."beta\.kubernetes\.io/os"=linux \
      --set controller.admissionWebhooks.patch.nodeSelector."beta\.kubernetes\.io/os"=linux
    ```
- Install Presidio
    ```sh
    helm upgrade presidio ./charts/presidio \
      --kube-context $AKS_CLUSTER_NAME \
      --namespace presidio \
      --create-namespace \
      --install \
      --wait
    ```
- Run `kubectl get service -n ingress-basic` and look for an external IP address.

### Azure Cosmos DB

- Link for setup: https://portal.azure.com/#create/Microsoft.DocumentDB
- API: Azure Cosmos DB for Mongo API
- Ensure that the Azure Function and the CosmosDB instance are on the same VNet, if the Connectivity method is set to anything other than All networks.

### Function Config

Use the following Application Settings with the deployed Azure Function:
1. `COSMOS_MONGO_CONNECTION_STRING` :`@Microsoft.KeyVault(SecretUri=https://tcx-azure-devops-dlp.vault.azure.net/secrets/cosmos-mongo-connection-string/6ae58c28706887af9e01c500175a0c58)` or `mongodb://root:password@localhost:27017`
1. `MONGO_SSL`: `true`
1. `PRESIDIO_ENDPOINT`: `http://<NGINX_INGRESS_IP_ADDRESS>/analyze`

Note: For `COSMOS_MONGO_CONNECTION_STRING`, you may use the connection string directly, or you may store the connection string in azure keyvault and have the function resolve it using the config mentioned above.
