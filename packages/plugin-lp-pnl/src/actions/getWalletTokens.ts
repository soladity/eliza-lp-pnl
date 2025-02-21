import {
    settings,
    type ActionExample,
    type Content,
    generateObjectDeprecated,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    composeContext,
    type Action,
    elizaLogger
} from "@elizaos/core";

import axios from "axios"
import { BirdeyeApiResponse, TokenType } from "../types";
import { extractAddresses } from "../utils";
import { BirdeyeProvider } from "../birdeye";

const getTokensTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "walletAddress": "
    ",
}
\`\`\`

{{recentMessages}}

Given the recent messages and wallet address below:

{{walletAddress}}

Provide the solana wallet address:
- Solana wallet address to get tokens held by that walllet

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined. The result should be a valid JSON object with the following schema:
\`\`\`json
[{

    "address": string | null,
    "decimals": number | string | null,
    "balance": number | string | null,
    "uiAmount": number | string | null,
    "chainId": string | null,
    "name": string | null,
    "symbol": string | null,
    "icon": string | null,
    "logoURI": string | null,
    "priceUsd": number | string | null,
    "valueUsd": number | string | null
}]
\`\`\``;



// get token accounts held by wallet public key
export const getWalletTokens: Action = {
    name: "GET_WALLET_TOKENS",
    similes: [
        "GET_LP_TOKENS",
        "SHOW_TOKENS_WALLET",
        "LIST_TOKENS_WALLET",
        "SHOW_WALLET_TOKENS",
        "LIST_WALLET_TOKENS",
        "GET_LP_TOKENS",
        "SEARCH_WALLET_ADDRESS",
        "FIND_WALLET_ADDRESS",
        "LOOKUP_WALLET_ADDRESS",
        "CHECK_WALLET_ADDRESS",
        "GET_WALLET_BY_ADDRESS",
        "WALLET_ADDRESS_INFO",
        "WALLET_ADDRESS_LOOKUP",
        "WALLET_ADDRESS_SEARCH",
        "WALLET_ADDRESS_CHECK",
        "WALLET_ADDRESS_DETAILS",
        "WALLET_CONTRACT_SEARCH",
        "WALLET_CONTRACT_LOOKUP",
        "WALLET_CONTRACT_INFO",
        "WALLET_CONTRACT_CHECK",
        "VERIFY_WALLET_ADDRESS",
        "VALIDATE_WALLET_ADDRESS",
        "GET_WALLET_INFO",
        "WALLET_INFO",
        "WALLET_REPORT",
        "WALLET_ANALYSIS",
        "WALLET_OVERVIEW",
        "WALLET_SUMMARY",
        "WALLET_INSIGHT",
        "WALLET_DATA",
        "WALLET_STATS",
        "WALLET_METRICS",
        "WALLET_PROFILE",
        "WALLET_REVIEW",
        "WALLET_CHECK",
        "WALLET_LOOKUP",
        "WALLET_FIND",
        "WALLET_DISCOVER",
        "WALLET_EXPLORE",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const addresses = extractAddresses(message.content.text);
        return addresses.length > 0;
    },
    description: "get tokens held by wallet.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        // composeState
        
        try {
            const addresses = extractAddresses(message.content.text);
            const provider = new BirdeyeProvider(runtime.cacheManager);
            const results: BirdeyeApiResponse[] = await Promise.all(
                addresses.map(async (address, i) => {
                    return provider.fetchWalletPortfolio(
                        {
                            wallet: address,
                        }
                    );
                })
            );

            console.log(results);

            const completeResults = `I performed a search for the wallet addresses you requested and found the following results:\n\n${results
                .map(
                    (result, i) =>
                        `${formatWalletReport(addresses[i], results.length, i, result)}`
                )
                .join("\n\n")}`;
            callback?.({ text: completeResults });
            return true;
        } catch (error) {
            console.error("Error in searchTokens handler:", error.message);
            callback?.({ text: `Error: ${error.message}` });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to see which token I hold in my wallet"
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Getting all tokens",
                    action: "GET_WALLET_TOKENS",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Done...",
                },
            },
        ],
        // Add more examples as needed
    ] as ActionExample[][],
} as Action;


const formatWalletReport = (
    address: string,
    totalResults: number,
    index: number,
    result: BirdeyeApiResponse
) => {
    const tokens = result.data.items.slice(0, 10) || [];
    const totalValue = tokens.reduce(
        (sum, token) => sum + (token.valueUsd || 0),
        0
    );

    let header = `Wallet Result ${totalResults > 1 ? `#${index + 1}` : ""}\n`;
    header += `👛 Address ${address}*\n`;
    header += `💰 Total Value: $${totalValue.toLocaleString()}\n`;
    header += "🔖 Top Holdings:";
    const tokenList = tokens
        .map(
            (token) =>
                `• $${token.symbol.toUpperCase()}: $${token.valueUsd?.toLocaleString()} (${token.uiAmount?.toFixed(4)} tokens)`
        )
        .join("\n");

    return `${header}\n${tokenList}`;
};
