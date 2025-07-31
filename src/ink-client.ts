import {contracts, pop} from "@polkadot-api/descriptors"
import {createClient} from "polkadot-api"
import {withPolkadotSdkCompat} from "polkadot-api/polkadot-sdk-compat"
import {type PolkadotSigner} from "polkadot-api/signer"
import {getWsProvider} from "polkadot-api/ws-provider/web"
import {createReviveSdk} from "@polkadot-api/sdk-ink"
import {encodeAddress} from "@polkadot/keyring"


export class MyContract {

    contract: any
    sender: PolkadotSigner
    senderAddress: string

    constructor(
        rpc: string,
        address: string,
        sender: PolkadotSigner,
    ) {

        const client = createClient(withPolkadotSdkCompat(getWsProvider(rpc)))
        const typedApi = client.getTypedApi(pop)
        const sdk = createReviveSdk(typedApi, contracts.guess_the_number)
        this.contract = sdk.getContract(address)

        this.sender = sender;
        this.senderAddress = encodeAddress(sender.publicKey)

    }

    async getCurrentGame(): Promise<any> {
        const {value, success} = await this.contract.query(
            "get_current_game",
            {
                origin: this.senderAddress,
            },
        )
        if (!success) {
            return Promise.reject("Error to query has_message method")
        }
        return value.response
    }


    async makeAGuess(guess: number): Promise<any> {

        console.log("Dry Run ...")
        const {value, success} = await this.contract.query(
            "guess",
            {
                origin: this.senderAddress,
                data: {guess},
            },
        )
        if (!success) {
            return Promise.reject("Error when dry run tx " + value.toString())
        }

        console.log("Submitting tx ... ")
        const result = await this.contract
            .send("guess", {
                origin: this.senderAddress,
                data: {guess},
            })
            .signAndSubmit(this.sender)

        if (!result.ok) {
            return Promise.reject("Error when submitting tx " + result)
        }
        console.log("tx: " + result.txHash);
    }


}
