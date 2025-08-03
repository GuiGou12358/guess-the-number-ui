import {createContext, useEffect, useState} from 'react';
import type {Attempt, Game} from "../types.ts";
import {useAccounts} from "@reactive-dot/react";
import {getOrCreateContract} from "../ink-client.tsx";


export const GameContext = createContext<GameContextStruct>();
export type GameContextStruct = {
    game : Game | undefined,
    attempts : Attempt[] | undefined,
    nbAttempts : number,
    startNewGame : (minNumber: number, maxNumber: number) => Promise<void>,
    makeGuess : (guess: number) => Promise<void>,
}

function updateAttempts(attempts: Attempt[], game: Game){
    if (game == undefined){
        return attempts;
    }
    const guess = game.last_guess;
    if (guess == undefined){
        return attempts;
    }

    const gameNumber = game.game_number;
    const attemptNumber = game.attempt;

    const attempt: Attempt = {
        gameNumber,
        attemptNumber,
        guess,
        clue: game.last_clue,
    }

    const index = attempts.findIndex(value => value.gameNumber === gameNumber && value.attemptNumber === attemptNumber);
    if (index == -1) {
        attempts.push(attempt);
    } else {
        attempts[index] = attempt;
    }
    return attempts
}


export const GameContextProvider = ({ children }) => {

    const [game, setGame] = useState<Game>();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [nbAttempts, setNbAttempts] = useState(0);
    const [nbNewGames, setNbNewGames] = useState(0);
    const [nbNewGuesses, setNbNewGuesses] = useState(0);

    const accounts = useAccounts();
    const signer = accounts.at(0)?.polkadotSigner;

    useEffect(() => {
        if (signer) {
            console.log("refresh game");
            getOrCreateContract(signer)
                .getCurrentGame()
                .then(
                    (game) => {
                        setGame(game);
                        setAttempts(updateAttempts([], game));
                    }
                );
        }
    }, [signer, nbNewGames]);

    useEffect(() => {
        if (signer) {
            console.log("refresh attempts");
            getOrCreateContract(signer)
                .getCurrentGame()
                .then(
                    (game) => {
                        setAttempts(updateAttempts(attempts, game));
                        setNbAttempts(nbAttempts+1);
                    }
                );
        }
    }, [signer, game, nbNewGuesses]);

    const refreshInBackground = async () => {
        if (signer) {
            console.log("periodically refresh attempts");
            getOrCreateContract(signer)
                .getCurrentGame()
                .then(
                    (game) => {
                        setAttempts(updateAttempts(attempts, game));
                        setNbAttempts(nbAttempts+1);
                    }
                );
        }
    };

    useEffect(() => {
        const backgroundSyncInterval = setInterval(() => {
            //setRefreshGame(refreshGame+1);
            refreshInBackground();
        }, 20 * 1000); // every 20 seconds

        return () => {
            clearInterval(backgroundSyncInterval);
        }
    });

    /*
    const [status, guess] = useContractMutation((mutate) =>
        mutate(gtnContract, address, "guess", {
            data: {"guess": inputNumber.current?.value},
        }),
    );
     */

    const refreshGuesses = () => {
        setNbNewGuesses(nbNewGuesses + 1);
    }

    const makeGuess = async (guess: number) => {
        console.log("Guess " + guess);
        if (isNaN(Number(guess)) || guess < 0){
            console.error("Guess number incorrect");
            return;
        }
        if (signer){
            await getOrCreateContract(signer).makeAGuess(guess, refreshGuesses);
        }
    };

    /*
    const [status, newGame] = useContractMutation((mutate) =>
        mutate(gtnContract, address, "start_new_game", {
            data: {"min_number": refMin.current?.value, "max_number": refMax.current?.value},
        }),
    );
*/

    const refreshGame = () => {
        setNbNewGames(nbNewGames + 1);
    }

    const startNewGame = async (minNumber: number, maxNumber: number) => {
        console.log("Start new game " + minNumber + " - " + maxNumber);
        if (isNaN(Number(minNumber)) || isNaN(Number(maxNumber)) || minNumber >= maxNumber || minNumber < 0){
            console.error("Min and Max number incorrect");
            return;
        }
        if (signer){
            //newGame();
            await getOrCreateContract(signer).startNewGame(minNumber, maxNumber, refreshGame);
        }
    };


    return (
        <GameContext.Provider value={{ game, attempts, nbAttempts, startNewGame, makeGuess }} >
            {children}
        </GameContext.Provider>
    );

}