import {createContext, useEffect, useState} from 'react';
import type {Attempt, Game} from "../types.ts";
import {getOrCreateContract} from "../contract.tsx";
import {encodeAddress} from "@polkadot/keyring";
import {useChainId, useSigner} from "@reactive-dot/react";

export const GameContext = createContext<GameContextStruct>();
export type GameContextStruct = {
    game : Game | undefined,
    getAttempts : () => Attempt[],
    refreshGuesses : () => void,
    refreshGame : () => void,
}

function updateAttempts(attempts: Attempt[], game: Game){
    if (game == undefined){
        return { updated: false, attempts };
    }
    const guess = game.last_guess;
    if (guess == undefined){
        return { updated: false, attempts };
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
    let updated = false;
    if (index == -1) {
        attempts.push(attempt);
        updated = true;
    } else {
        const current = attempts[index];
        if (! areEqualAttempts(current, attempt)){
            attempts[index] = attempt;
            updated = true;
        }
    }
    return { updated, attempts };
}


function areEqualAttempts(attempt1: Attempt, attempt2: Attempt){
    if (attempt1.gameNumber != attempt2.gameNumber){
        return false;
    }
    if (attempt1.attemptNumber != attempt2.attemptNumber){
        return false;
    }
    if (attempt1.guess != attempt2.guess){
        return false;
    }
    if (attempt1.clue == undefined){
        return attempt2.clue == undefined;
    }
    if (attempt2.clue == undefined){
        return false;
    }
    return attempt1.clue.type == attempt2.clue.type;
}

export const GameContextProvider = ({ children }) => {

    const chainId = useChainId();
    const signer = useSigner();
    const [game, setGame] = useState<Game>();
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [nbNewGames, setNbNewGames] = useState(0);
    const [nbNewGuesses, setNbNewGuesses] = useState(0);

    useEffect(() => {
        if (signer && chainId) {
            console.log("address: " + encodeAddress(signer.publicKey));
            console.log("refresh game");
            getOrCreateContract(chainId)
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        setGame(game);
                        const {updated, attempts: atts } = updateAttempts([], game);
                        if (updated) {
                            setAttempts(atts);
                        }
                    }
                ).catch((e) => {
                    setGame(undefined);
                    setAttempts([]);
                });
        } else {
            console.warn("no selected address");
        }
    }, [signer, chainId, nbNewGames]);

    useEffect(() => {
        if (signer && chainId) {
            console.log("refresh attempts");
            getOrCreateContract(chainId)
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        const {updated, attempts: atts } = updateAttempts(attempts, game);
                        if (updated) {
                            setAttempts(atts);
                        }
                    }
                ).catch((e) => {
                    setAttempts([]);
                });
        }
    }, [game, nbNewGuesses]);

    const refreshInBackground = async () => {
        if (signer && chainId) {
            console.log("periodically refresh attempts");
            getOrCreateContract(chainId)
                .getCurrentGame(signer)
                .then(
                    (game) => {
                        const {updated, attempts: atts } = updateAttempts(attempts, game);
                        if (updated) {
                            setAttempts(atts);
                            refreshGuesses();
                        }
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
        if (game == undefined || attempts == undefined){
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