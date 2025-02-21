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

// get token accounts held by wallet public key
export const getWalletLPTokens: Action = {
    name: "GET_WALLET_TOKENS",
    similes: [
        "GET_LP_TOKENS",
        "SHOW_LP_TOKENS_WALLET",
        "LIST_LP_TOKENS_WALLET",
        "SHOW_WALLET_LIQUIDITY_TOKENS",
        "LIST_WALLET_LIQUIDITY_TOKENS",
        "GET_LIQUIDITY_TOKENS",
        "SEARCH_LIQUIDITY_TOKENS_WALLET_ADDRESS",
        "FIND_LIQUIDITY_TOKENS_WALLET_ADDRESS",
        "LOOKUP_LIQUIDITY_TOKENS_WALLET_ADDRESS",
        "CHECK_LIQUIDITY_TOKENS_WALLET_ADDRESS",
        "GET_LIQUIDITY_TOKENS_WALLET_BY_ADDRESS",
        "LIQUIDITY_TOKENS_WALLET_ADDRESS_INFO",
        "WALLET_ADDRESS_LOOKUP_LIQUIDITY_TOKENS",
        "WALLET_ADDRESS_SEARCH_LIQUIDITY_TOKENS",
        "WALLET_ADDRESS_CHECK_LIQUIDITY_TOKENS",
        "WALLET_ADDRESS_DETAILS_LIQUIDITY_TOKENS",
        "WALLET_CONTRACT_SEARCH_LIQUIDITY_TOKENS",
        "WALLET_CONTRACT_LOOKUP_LIQUIDITY_TOKENS",
        "WALLET_CONTRACT_INFO_LIQUIDITY_TOKENS",
        "WALLET_CONTRACT_CHECK_LIQUIDITY_TOKENS",
        "VERIFY_WALLET_ADDRESS_LIQUIDITY_TOKENS",
        "VALIDATE_WALLET_ADDRESS_LIQUIDITY_TOKENS",
        "GET_WALLET_INFO_LIQUIDITY_TOKENS",
        "WALLET_INFO_LIQUIDITY_TOKENS",
        "WALLET_REPORT_LIQUIDITY_TOKENS",
        "WALLET_ANALYSIS_LIQUIDITY_TOKENS",
        "WALLET_OVERVIEW_LIQUIDITY_TOKENS",
        "WALLET_SUMMARY_LIQUIDITY_TOKENS",
        "WALLET_INSIGHT_LIQUIDITY_TOKENS",
        "WALLET_DATA_LIQUIDITY_TOKENS",
        "WALLET_STATS_LIQUIDITY_TOKENS",
        "WALLET_METRICS_LIQUIDITY_TOKENS",
        "WALLET_PROFILE_LIQUIDITY_TOKENS",
        "WALLET_REVIEW_LIQUIDITY_TOKENS",
        "WALLET_CHECK_LIQUIDITY_TOKENS",
        "WALLET_LOOKUP_LIQUIDITY_TOKENS",
        "WALLET_FIND_LIQUIDITY_TOKENS",
        "WALLET_DISCOVER_LIQUIDITY_TOKENS",
        "WALLET_EXPLORE_LIQUIDITY_TOKENS",
        "SHOW_WALLET_LP_TOKENS",
        "LIST_WALLET_LP_TOKENS",
        "GET_LP_TOKENS",
        "SEARCH_LP_TOKENS_WALLET_ADDRESS",
        "FIND_LP_TOKENS_WALLET_ADDRESS",
        "LOOKUP_LP_TOKENS_WALLET_ADDRESS",
        "CHECK_LP_TOKENS_WALLET_ADDRESS",
        "GET_LP_TOKENS_WALLET_BY_ADDRESS",
        "LP_TOKENS_WALLET_ADDRESS_INFO",
        "WALLET_ADDRESS_LOOKUP_LP_TOKENS",
        "WALLET_ADDRESS_SEARCH_LP_TOKENS",
        "WALLET_ADDRESS_CHECK_LP_TOKENS",
        "WALLET_ADDRESS_DETAILS_LP_TOKENS",
        "WALLET_CONTRACT_SEARCH_LP_TOKENS",
        "WALLET_CONTRACT_LOOKUP_LP_TOKENS",
        "WALLET_CONTRACT_INFO_LP_TOKENS",
        "WALLET_CONTRACT_CHECK_LP_TOKENS",
        "VERIFY_WALLET_ADDRESS_LP_TOKENS",
        "VALIDATE_WALLET_ADDRESS_LP_TOKENS",
        "GET_WALLET_INFO_LP_TOKENS",
        "WALLET_INFO_LP_TOKENS",
        "WALLET_REPORT_LP_TOKENS",
        "WALLET_ANALYSIS_LP_TOKENS",
        "WALLET_OVERVIEW_LP_TOKENS",
        "WALLET_SUMMARY_LP_TOKENS",
        "WALLET_INSIGHT_LP_TOKENS",
        "WALLET_DATA_LP_TOKENS",
        "WALLET_STATS_LP_TOKENS",
        "WALLET_METRICS_LP_TOKENS",
        "WALLET_PROFILE_LP_TOKENS",
        "WALLET_REVIEW_LP_TOKENS",
        "WALLET_CHECK_LP_TOKENS",
        "WALLET_LOOKUP_LP_TOKENS",
        "WALLET_FIND_LP_TOKENS",
        "WALLET_DISCOVER_LP_TOKENS",
        "WALLET_EXPLORE_LP_TOKENS",
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

            const completeResults = `I performed a search for the transactions you requested and found the following results:\n\n${results
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
    const tokens = result.data.items || [];
    const totalValue = tokens.reduce(
        (sum, token) => sum + (token.valueUsd || 0),
        0
    );

    let header = `Wallet Result ${totalResults > 1 ? `#${index + 1}` : ""}\n`;
    header += `👛 Address ${address}*\n`;

    // Filter only LP tokens
    const tokenList = tokens.filter(token => token.icon == undefined);

    // Tokens Array to String
    tokenList.map(
            (token) =>
                `• ${token.address}: (${token.uiAmount?.toFixed(4)} tokens)`
        )
        .join("\n");

    return `${header}\n${tokenList}`;
};
