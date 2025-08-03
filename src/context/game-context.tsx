import {createContext, useContext, useEffect, useState} from 'react';
import type {Attempt, Game} from "../types.ts";
import {getOrCreateContract} from "../contract.tsx";
import {MySignerContext} from "./my-signer-context.tsx";

export const GameContext = createContext<GameContextStruct>();
export type GameContextStruct = {
    game : Game | undefined,
    getAttempts : () => Attempt[],
    //startNewGame : (minNumber: number, maxNumber: number) => Promise<void>,
    //makeGuess : (guess: number) => Promise<void>,
    refreshGuesses : () => void,
    refreshGame : () => void,
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
    //const signer = useContext(SignerContext);
    const [game, setGame] = useState<Game>();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [nbAttempts, setNbAttempts] = useState(0);
    const [nbNewGames, setNbNewGames] = useState(0);
    const [nbNewGuesses, setNbNewGuesses] = useState(0);

    useEffect(() => {
        console.log("signer " + signer?.publicKey);
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

    const refreshGuesses = () => {
        setNbNewGuesses(nbNewGuesses + 1);
    }

    const refreshGame = () => {
        setNbNewGames(nbNewGames + 1);
    }

    const getAttempts =  () => {
        if (game == undefined || attempts==undefined){
            return [];
        }
        return attempts.filter(a => a.gameNumber == game.game_number);
    };

    return (
        <GameContext.Provider value={{ game, getAttempts, refreshGuesses, refreshGame }} >
            {children}
        </GameContext.Provider>
    );

}