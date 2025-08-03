const regex = new RegExp(/^\d+$/);

export function isPositiveNumber(input: string | undefined){
    return input != undefined && regex.test(input);
}
