import Long from "long";
import { createQueryClient } from "../helper";
import { QueryClientImpl } from 'comdex-codec/build/comdex/vault/v1beta1/query'


export const queryExtendedPairVault = (productId, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error);
            return;
        }
        new QueryClientImpl(rpcClient)
            .QueryExtendedPairIDByProduct({
                productId: Long.fromNumber(productId)
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);
            });
    });
};


export const queryVaultByProductId = (
    product,
    callback
) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error);
            return;
        }
        new QueryClientImpl(rpcClient)
            .QueryAllVaultsByProduct({
                appId: Long.fromNumber(product)
            })
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);
            });
    });
};

export const queryUserVaults = (
    owner,
    callback
) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error);
            return;
        }
        new QueryClientImpl(rpcClient)
            .QueryVaultInfoByOwner({
                owner: owner
            })
            .then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);
            });
    });
};

export const queryVaults = (id, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error)
        }
        new QueryClientImpl(rpcClient)
            .QueryVault({
                id: id
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);
            });
    })
}
export const queryOwnerVaults = (productId, address, extentedPairId, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error)
        }
        new QueryClientImpl(rpcClient)
            .QueryVaultOfOwnerByExtendedPair({
                productId: Long.fromNumber(productId),
                owner: address,
                extendedPairId: Long.fromNumber(extentedPairId),
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                // callback(error?.message);
                // callback("Vault does't exist");
            });
    })
}
export const queryOwnerVaultsInfo = (ownerVaultId, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error)
        }
        new QueryClientImpl(rpcClient)
            .QueryVault({
                id: ownerVaultId,
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);

            });
    })
}
export const queryAllVaultByProduct = (productId, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error)
        }
        new QueryClientImpl(rpcClient)
            .QueryVaultByProduct({
                productId: Long.fromNumber(productId),
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);

            });
    })
}

export const queryAppTVL = (appId, callback) => {
    createQueryClient((error, rpcClient) => {
        if (error) {
            callback(error);
            return;
        }
        new QueryClientImpl(rpcClient)
            .QueryTVLlockedByApp({
                appId: Long.fromNumber(appId),
            }).then((result) => {
                callback(null, result);
            })
            .catch((error) => {
                callback(error?.message);
            });
    });
};