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

const birdeyeApiEndpoint = "https://public-api.birdeye.so/v1"



const getTokensTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "walletAddress": "GpmN7PGbV6cBk7nnhh29jVY6MZpSCPSEVdqVRkQH5mc2",
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
    similes: ["GET_LP_TOKENS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Check if the necessary parameters are provided in the message
        elizaLogger.log("Message:", message);
        return true;
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
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const getTokensContext = composeContext({
            state,
            template: getTokensTemplate,
        });

        const response = await generateObjectDeprecated({
            runtime,
            context: getTokensContext,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.log("Response:", response);

        if (response.walletAddress) {
            response.inputTokenCA = settings.SOL_ADDRESS;
        }
        const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              'x-chain': 'solana',
              'X-API-KEY': runtime.getSetting("BIRDEYE_API_KEY")
            }
        };

        try {
            elizaLogger.log("Wallet Address:", response.walletAddress);
            const { data } = await axios.get(`${birdeyeApiEndpoint}/wallet/token_list?wallet=${response.walletAddress}`, options);

            
            const responseMsg = {
                text: `Swap completed successfully! Transaction ID: aaaaaa`,
            };

            callback?.(responseMsg);

            return true;
        } catch (error) {
            elizaLogger.error("Error during token swap:", error);
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
                    text: "Getting all tokens held by GpmN7PGbV6cBk7nnhh29jVY6MZpSCPSEVdqVRkQH5mc2...",
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