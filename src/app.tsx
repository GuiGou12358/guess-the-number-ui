import {config} from "./config";
import {ChainProvider, ReactiveDotProvider} from "@reactive-dot/react";
import {Suspense} from "react";
import {ConnectionButton} from "dot-connect/react.js";
import {Game} from "./game.tsx";
import {Accounts} from "./accounts.tsx";

export function App() {
    return (
        <ReactiveDotProvider config={config}>
            <ChainProvider chainId="pop">
                {/* Make sure there is at least one Suspense boundary wrapping the app */}
                <Suspense>
                    <ConnectionButton/>
                    <Accounts/>
                    <Game/>
                </Suspense>
            </ChainProvider>
        </ReactiveDotProvider>
    );
}