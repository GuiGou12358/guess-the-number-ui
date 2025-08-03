import {createContext, useContext, useEffect, useState} from 'react';
import type {Attempt, Game} from "../types.ts";
import {getOrCreateContract} from "../contract.tsx";
import {MySignerContext} from "./my-signer-context.tsx";
import {toast} from "react-hot-toast";


export const GameContext = createContext<GameContextStruct>();
export type GameContextStruct = {
    game : Game | undefined,
    getAttempts : () => Attempt[],
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

    const signer = useContext(MySignerContext);
    const [game, setGame] = useState<Game>();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [nbAttempts, setNbAttempts] = useState(0);
    const [nbNewGames, setNbNewGames] = useState(0);
    const [nbNewGuesses, setNbNewGuesses] = useState(0);

    useEffect(() => {
        console.log("signer " + signer);
        if (signer) {
            console.log("refresh game");
            getOrCreateContract()
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        setGame(game);
                        setAttempts(updateAttempts([], game));
                    }
                ).catch((e) => {
                    setGame(undefined);
                    setAttempts([]);
                });
        }
    }, [signer, nbNewGames]);

    useEffect(() => {
        if (signer) {
            console.log("refresh attempts");
            getOrCreateContract()
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        setAttempts(updateAttempts(attempts, game));
                        setNbAttempts(nbAttempts+1);
                    }
                ).catch((e) => {
                    setAttempts([]);
                });
        }
    }, [signer, game, nbNewGuesses]);

    const refreshInBackground = async () => {
        if (signer) {
            console.log("periodically refresh attempts");
            getOrCreateContract()
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        setAttempts(updateAttempts(attempts, game));
                        setNbAttempts(nbAttempts+1);
                    }
                ).catch((e) => {
                    setAttempts([]);
                });
        }
    };

    useEffect(() => {
        const backgroundSyncInterval = setInterval(() => {
            refreshInBackground();
        }, 10 * 1000); // every 10 seconds

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
            toast.error("The input must be positive number");
            return;
        }
        if (signer){
            await getOrCreateContract().makeAGuess(signer, guess, refreshGuesses);
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
        if (isNaN(Number(minNumber)) || isNaN(Number(maxNumber)) || minNumber < 0 || maxNumber < 0){
            toast.error("Min and Max must be positive numbers");
            return;
        }
        if (minNumber >= maxNumber){
            toast.error("Min must be inferior to Max");
            return;
        }
        if (signer){
            //newGame();
            await getOrCreateContract().startNewGame(signer, minNumber, maxNumber, refreshGame);
        }
    };

    const getAttempts =  () => {
        if (game == undefined || attempts==undefined){
            return [];
        }
        return attempts.filter(a => a.gameNumber == game.game_number);
    };

    return (
        <GameContext.Provider value={{ game, getAttempts, startNewGame, makeGuess }} >
            {children}
        </GameContext.Provider>
    );

}