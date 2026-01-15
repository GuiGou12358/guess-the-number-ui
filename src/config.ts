import {contracts, wah} from "@polkadot-api/descriptors";
import {getWsProvider} from "@polkadot-api/ws-provider/web";
import {defineConfig, defineContract} from "@reactive-dot/core";
import {InjectedWalletProvider} from "@reactive-dot/core/wallets.js";
import {registerDotConnect} from "dot-connect";

const WAH_RPC = "wss://westend-asset-hub-rpc.polkadot.io";
const WAH_CONTRACT_ADDRESS = "0x21A41F8e279Cb3299fcf36068118C60eF63c332C";


export const config = defineConfig({
    chains: {
        wah: {
            descriptor: wah,
            provider: getWsProvider(WAH_RPC),
            rpc: WAH_RPC,
            contractAddress: WAH_CONTRACT_ADDRESS,
        },
    },
    targetChains:["wah"],
    wallets: [
        new InjectedWalletProvider(),
    ],

});

// @ts-ignore
registerDotConnect({wallets: config.wallets,})

export const gtnContract = defineContract({
    descriptor: contracts.guess_the_number,
});

export const getContractAddress = (chainId: string) : string => {
    // @ts-ignore
    return config.chains[chainId]?.contractAddress;
}

export const getRpc = (chainId: string) : string => {
    // @ts-ignore
    return config.chains[chainId]?.rpc;
}


