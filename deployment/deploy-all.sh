#!/usr/bin/env bash

set -e
SCRIPT_DIR="$(realpath "$(dirname "$0")")"
source "$SCRIPT_DIR/env.sh"

pushd "$(dirname "${BASH_SOURCE[0]}")"

./create-resource-group.sh
./create-cosmos.sh
./create-aks.sh
./deploy-nginx.sh
./deploy-presidio.sh
./deploy-azure-function.sh

popd
