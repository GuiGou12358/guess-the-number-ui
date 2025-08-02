export type Attempt = {
    gameNumber: bigint;
    attemptNumber: number,
    guess: number,
    clue : Clue | unknown,
}

export type Clue = {
        type: "More", value: undefined
    }
    | {
    type: "Less", value: undefined
}
    | {
    type: "Found", value: undefined
};


export type Game = {
    game_number: bigint;
    min_number: number;
    max_number: number;
    attempt: number;
    last_guess: number | undefined;
    last_clue: Clue | undefined;
}
