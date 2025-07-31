import {SignerProvider, useAccounts, useContractMutation, useLazyLoadQuery} from "@reactive-dot/react";
import {Suspense, useEffect, useState} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {idle, MutationError, pending} from "@reactive-dot/core";
import {MyContract} from "./ink-client.ts";
import {type PolkadotSigner} from "polkadot-api/signer";
import {TextField} from "@mui/material";
import {CONTRACT_ADDRESS, gtnContract} from "./config.ts";


let myContract: MyContract | undefined;

type ContractProps = {
    address: string;
}


type Clue = {
        type: "More", value: undefined
    }
    | {
    type: "Less", value: undefined
}
    | {
    type: "Found", value: undefined
};


type Game = {
    game_number: bigint;
    min_number: number;
    max_number: number;
    attempt: number;
    last_guess: number | undefined;
    last_clue: Clue | undefined;
}


function getOrCreateContract(signer: PolkadotSigner) {
    if (!myContract) {
        myContract = new MyContract("wss://rpc1.paseo.popnetwork.xyz", CONTRACT_ADDRESS, signer);
    }
    return myContract;
}


export function CurrentGame({address}: ContractProps) {
    const accounts = useAccounts();
    const senderAddress = accounts.at(0)?.address;

    const [game, setGame] = useState<Game>();

    const signer = accounts.at(0)?.polkadotSigner;

    const refreshInBackground = async () => {
        try {
            if (signer) {
                const current: Game = await getOrCreateContract(signer).getCurrentGame();
                setGame(current);
            }

        } catch (e) {
            console.error(e);
        }
    };

    //refreshInBackground();

    useEffect(() => {
        const backgroundSyncInterval = setInterval(() => {
            refreshInBackground();
        }, 10 * 1000); // every 10 seconds

        return () => {
            clearInterval(backgroundSyncInterval);
        }
    });

    // this code doesn't work for the time being
    const game2: Game | undefined = useLazyLoadQuery(
        (builder) =>
            builder.contract(
                gtnContract,
                address,
                (builder) => builder.message("get_current_game",
                    {
                        origin: senderAddress, // it doesn't work
                    }
                ),
            ),
    );
    console.log(game2)

    return (
        <div>
            <div>
                {(() => {
                    if (game == undefined){
                        return "The game is loading or no game is started yet"
                    }
                    return "Game " + game.game_number + " - Guess the number between " + game.min_number + " and " + game.max_number;
                })()}
            </div>
            <div>
                {(() => {
                    if (game == undefined){
                        return "";
                    }
                    if (game.last_guess == undefined){
                        return "No guess made yet";
                    }
                    if (game.last_clue == undefined){
                        return "Attempt " + game.attempt + " - Waiting for the result for number " + game.last_guess;
                    }
                    if (game.last_clue.type == "Less"){
                        return "Attempt " + game.attempt + " - My number is less than " + game.last_guess;
                    }
                    if (game.last_clue.type == "More"){
                        return "Attempt " + game.attempt + " - My number is more than " + game.last_guess;
                    }
                    if (game.last_clue.type == "Found"){
                        return "Congrats, you found the number " + game.last_guess + " in " + game.attempt + " attempts!";
                    }
                    return "";
                })()}
            </div>
        </div>
    );
}


function MakeGuess({address}: ContractProps) {

    const [inputNumber, setInputNumber] = useState<number>(-1);

    const [status, guess] = useContractMutation((mutate) =>
        mutate(gtnContract, address, "guess", {
            data: {"guess": inputNumber},
        }),
    );

    const setInputValue = (value: string) => {
        if (value) {
            const v = Number(value);
            console.log(v);
            setInputNumber(v);
        }
    };

    return (
        <div>
            <TextField label="Enter your number" variant="outlined"
                       onChange={event => setInputValue(event.target.value)}/>
            <button onClick={guess}>Make a guess</button>
            {(() => {
                switch (status) {
                    case idle:
                        return <p>No transaction submitted yet.</p>;
                    case pending:
                        return <p>Submitting transaction...</p>;
                    default:
                        if (status instanceof MutationError) {
                            return <p>Error submitting transaction!</p>;
                        }
                        return (
                            <p>
                                Submitted tx with hash: {status.txHash}, current state:{" "}
                                {status.type}
                            </p>
                        );
                }
            })()}
        </div>
    );
}

function NewGame({address}: ContractProps) {
    const [status, newGame] = useContractMutation((mutate) =>
        mutate(gtnContract, address, "start_new_game", {
            data: {"min_number": 1, "max_number": 100},
        }),
    );

    return (
        <div>
            <button onClick={() => newGame()}>Start New Game</button>
            {(() => {
                switch (status) {
                    case idle:
                        return <p>No transaction submitted yet.</p>;
                    case pending:
                        return <p>Submitting transaction...</p>;
                    default:
                        if (status instanceof MutationError) {
                            return <p>Error submitting transaction!</p>;
                        }
                        return (
                            <p>
                                Submitted tx with hash: {status.txHash}, current state:{" "}
                                {status.type}
                            </p>
                        );
                }
            })()}
        </div>
    );
}


export function Game() {

    const accounts = useAccounts();

    return (
        <section>
            <ErrorBoundary fallback="Error fetching data!">
                <Suspense fallback="Fetching current game ...">
                    <CurrentGame address={CONTRACT_ADDRESS}/>
                </Suspense>
            </ErrorBoundary>
            <SignerProvider signer={accounts.at(0)?.polkadotSigner}>
                <MakeGuess address={CONTRACT_ADDRESS}/>
                <NewGame address={CONTRACT_ADDRESS}/>
            </SignerProvider>
        </section>
    );
}