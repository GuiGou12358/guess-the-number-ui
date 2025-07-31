import {contracts, pop} from "@polkadot-api/descriptors";
import {getWsProvider} from "@polkadot-api/ws-provider/web";
import {defineConfig, defineContract} from "@reactive-dot/core";
import {InjectedWalletProvider} from "@reactive-dot/core/wallets.js";
import {registerDotConnect} from "dot-connect";


export const CONTRACT_ADDRESS = "0xD6Ad3e67e2514bED804acc45945A7a102C4c6Ae4";

export const config = defineConfig({
    chains: {
        pop: {
            descriptor: pop,
            provider: getWsProvider("wss://rpc1.paseo.popnetwork.xyz"),
        },
    },
    wallets: [
        new InjectedWalletProvider(),
    ],
});

// @ts-ignore
registerDotConnect({wallets: config.wallets,})

export const gtnContract = defineContract({
    descriptor: contracts.guess_the_number,
});