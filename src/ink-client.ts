import {contracts, pop} from "@polkadot-api/descriptors"
import {createClient, type TxEvent, type TxObservable} from "polkadot-api"
import {withPolkadotSdkCompat} from "polkadot-api/polkadot-sdk-compat"
import {type PolkadotSigner} from "polkadot-api/signer"
import {getWsProvider} from "polkadot-api/ws-provider/web"
import {createReviveSdk} from "@polkadot-api/sdk-ink"
import {encodeAddress} from "@polkadot/keyring"
import {toast, type ToastOptions} from "react-hot-toast"
import {type Observer} from "rxjs"
import {CONTRACT_ADDRESS} from "./config.ts";

let myContract: MyContract | undefined;

export function getOrCreateContract(signer: PolkadotSigner) {
    if (!myContract) {
        myContract = new MyContract("wss://rpc1.paseo.popnetwork.xyz", CONTRACT_ADDRESS, signer);
    }
    return myContract;
}

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


    async makeAGuess(guess: number, callback: Callback): Promise<any> {

        const tx = {
            origin: this.senderAddress,
            data: {guess},
        }

        console.log("Dry Run ...")
        const {value, success} = await this.contract.query("guess", tx);
        if (!success) {
            console.error("Error when dry run tx " + value.toString())
            toast.error("Error when dry run tx " + value.toString());
        }

        console.log("Submitting tx ... ")
        const txToast = toast.loading(
            "Submitting Transaction ...",
            { position: 'bottom-right' }
        );
        this.contract
            .send("guess", tx)
            .signSubmitAndWatch(this.sender)
            .subscribe(buildEventObserver(txToast, callback));
    }


    async startNewGame(minNumber: number, maxNumber: number, callback: Callback): Promise<any> {

        const tx = {
            origin: this.senderAddress,
            data: {"min_number": minNumber, "max_number": maxNumber},
        }

        console.log("Dry Run ...")
        const {value, success} = await this.contract.query("start_new_game", tx,)
        if (!success) {
            console.error("Error when dry run tx " + value.toString())
            toast.error("Error when dry run tx " + value.toString());
        }

        console.log("Submitting tx ... ")
        const txToast = toast.loading(
            "Submitting Transaction ...",
            { position: 'bottom-right' }
        );
        this.contract
            .send("start_new_game", tx)
            .signSubmitAndWatch(this.sender)
            .subscribe(buildEventObserver(txToast, callback));
    }
}


type Callback = () => void;

function buildEventObserver(toastId: string, callback: Callback): Partial<Observer<TxEvent>>{
    return {
        next: (event) => {
            console.log("Tx event: ", event.type)
            toast.loading('Tx event:' + event.type, {id: toastId});
            if (event.type === "signed") {
                toast.loading("Signed tx with hash:" + event.txHash, {id: toastId});
            }
            if (event.type === "broadcasted") {
                toast.loading("Broadcasted tx with hash:" + event.txHash, {id: toastId});
            }
            if (event.type === "txBestBlocksState") {
                toast.loading("Submitted tx with hash:" + event.txHash, {id: toastId});
            }
            if (event.type === "finalized") {
                toast.loading("Finalized tx with hash:" + event.txHash, {id: toastId});
            }
        },
        error: (message) => {
            console.error(message)
            toast.dismiss(toastId);
            toast.error(message);
        },
        complete: () => {
            const message = "Transaction sent successfully";
            /*
            const toastValue = (t) => (
                <span "className"="toast-tx-result text-right">
                    Transaction sent successfully
                    <Button sx={{margin:'0 3px', textTransform:'none'}} onClick={() => toast.dismiss(t.id)}>X</Button>
                 </span>
            )
             */
            toast.dismiss(toastId);
            const toastOptions: ToastOptions = {
                duration: 5000,
                position: 'bottom-right',
            };
            toast("Transaction sent successfully", toastOptions);
            callback();
        }
    };
}