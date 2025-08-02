import {useAccounts} from "@reactive-dot/react";

export function Accounts() {
    const accounts = useAccounts();

    return (
        <section>
            <header>
                <h3>Accounts</h3>
            </header>
            <ul>
                {accounts.map((account, index) => (
                    <li key={index}>
                        <div>{account.address}</div>
                        <div>{account.name}</div>
                    </li>
                ))}
            </ul>
        </section>
    );
}