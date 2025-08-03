import type { PolkadotSigner } from "polkadot-api";
import { createContext, type PropsWithChildren } from "react";

export const MySignerContext = createContext<PolkadotSigner | undefined>(
    undefined,
);

export type MySignerProviderProps = PropsWithChildren<{
    /**
     * The default signer
     */
    signer: PolkadotSigner | undefined;
}>;

/**
 * React context provider to assign a default signer.
 *
 * @group Contexts
 * @param props - Component props
 * @returns React element
 */
export function MySignerProvider(props: MySignerProviderProps) {
    return <MySignerContext value={props.signer}>{props.children}</MySignerContext>;
}
