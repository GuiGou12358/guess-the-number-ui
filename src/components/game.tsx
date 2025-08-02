import {SignerProvider, useAccounts} from "@reactive-dot/react";
import {useContext, useRef} from "react";
import {Box, Button, TextField} from "@mui/material";
import {GameContext} from "../context/game-context.tsx";


export function CurrentGame() {

    const { game, attempts, nbAttempts } = useContext(GameContext);

    if (game == undefined){
        return (<div>The game is loading or no game is started yet</div>);
    }
    return (
        <Box sx={{padding:"50px 40px 0 40px"}} display={'flex'} justifyContent={'center'}>
            <div>
                <div>Game {game?.game_number} - Guess the number between {game?.min_number} and {game?.max_number}</div>
                <div>
                    <Box sx={{padding:"50px 40px 0 40px"}} display={'flex'} justifyContent={'center'}>
                        <div>
                            <ul>
                                {attempts.map(attempt => (
                                    <li key={attempt.attemptNumber}>
                                        {(() => {
                                            if (attempt.clue == undefined){
                                                return "Attempt " + attempt.attemptNumber + " - Waiting for the result for number " + attempt.guess;
                                            }
                                            if (attempt.clue.type == "Less"){
                                                return "Attempt " + attempt.attemptNumber + " - My number is less than " + attempt.guess;
                                            }
                                            if (attempt.clue.type == "More"){
                                                return "Attempt " + attempt.attemptNumber + " - My number is more than " + attempt.guess;
                                            }
                                            if (attempt.clue.type == "Found"){
                                                return "Attempt " + attempt.attemptNumber + " - Congrats, you found the number " + attempt.guess + " !";
                                            }
                                            return "";
                                        })()}

                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Box>
                </div>
                <div>
                    <MakeGuess />
                </div>
            </div>
        </Box>
    );
}


export function MakeGuess() {

    const { makeGuess } = useContext(GameContext)

    // @ts-ignore
    const inputNumber = useRef();

    const submit = async () => {
        const guessNumber = inputNumber.current?.value;
        makeGuess(guessNumber);
    };

    return (
        <Box sx={{padding:"50px 40px 0 40px"}} display={'flex'} justifyContent={'center'}>
            <TextField inputRef={inputNumber} sx={{margin:'0 20px 0 0'}} id="guess-number-value" label="Enter your number" variant="outlined" />
            <Button onClick={submit} variant="contained">Make a guess</Button>
        </Box>
    );
}


function NewGame() {

    const { startNewGame } = useContext(GameContext)

    // @ts-ignore
    const refMin = useRef();
    // @ts-ignore
    const refMax = useRef();

    const submit = async () => {
        const minNumber = refMin.current?.value;
        const maxNumber = refMax.current?.value;
        startNewGame(minNumber, maxNumber);
    };

    return (
        <Box sx={{padding:"100px 40px 0 40px"}} display={'flex'} justifyContent={'center'}>
            <TextField inputRef={refMin} sx={{margin:'0 20px 0 0'}} id="new-game-min-value" label="Min" variant="outlined" />
            <TextField inputRef={refMax} sx={{margin:'0 20px 0 0'}} id="new-game-max-value" label="Max" variant="outlined" />
            <Button onClick={submit} variant="contained">Start New Game</Button>
        </Box>
    );
}


export function Game() {

    const accounts = useAccounts();

    return (
        <section>
            <SignerProvider signer={accounts.at(0)?.polkadotSigner}>
                <CurrentGame />
                <NewGame />
            </SignerProvider>
        </section>
    );
}