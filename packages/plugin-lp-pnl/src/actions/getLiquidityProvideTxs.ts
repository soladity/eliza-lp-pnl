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
        "GET_LP_TRANSACTIONS",
        "SHOW_LP_TRANSACTIONS_WALLET",
        "LIST_LP_TRANSACTIONS_WALLET",
        "SHOW_WALLET_LIQUIDITY_ADD_TRANSACTIONS",
        "LIST_WALLET_LIQUIDITY_ADD_TRANSACTIONS",
        "GET_LIQUIDITY_ADD_TRANSACTIONS",
        "SEARCH_LIQUIDITY_ADD_TRANSACTIONS_WALLET_ADDRESS",
        "FIND_LIQUIDITY_ADD_TRANSACTIONS_WALLET_ADDRESS",
        "LOOKUP_LIQUIDITY_ADD_TRANSACTIONS_WALLET_ADDRESS",
        "CHECK_LIQUIDITY_ADD_TRANSACTIONS_WALLET_ADDRESS",
        "GET_LIQUIDITY_ADD_TRANSACTIONS_WALLET_BY_ADDRESS",
        "LIQUIDITY_ADD_TRANSACTIONS_WALLET_ADDRESS_INFO",
        "WALLET_ADDRESS_LOOKUP_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_ADDRESS_SEARCH_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_ADDRESS_CHECK_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_ADDRESS_DETAILS_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_CONTRACT_SEARCH_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_CONTRACT_LOOKUP_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_CONTRACT_INFO_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_CONTRACT_CHECK_LIQUIDITY_ADD_TRANSACTIONS",
        "VERIFY_WALLET_ADDRESS_LIQUIDITY_ADD_TRANSACTIONS",
        "VALIDATE_WALLET_ADDRESS_LIQUIDITY_ADD_TRANSACTIONS",
        "GET_WALLET_INFO_LIQUIDITY_ADD_TRANSACTIONS",
        "WALLET_INFO_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_REPORT_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_ANALYSIS_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_OVERVIEW_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_SUMMARY_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_INSIGHT_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_DATA_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_STATS_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_METRICS_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_PROFILE_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_REVIEW_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_CHECK_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_LOOKUP_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_FIND_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_DISCOVER_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "WALLET_EXPLORE_LIQUIDITY_PROVIDE_TRANSACTIONS",
        "SHOW_WALLET_LP_ADD_TX",
        "LIST_WALLET_LP_ADD_TX",
        "GET_LP_ADD_TX",
        "SEARCH_LP_ADD_TX_WALLET_ADDRESS",
        "FIND_LP_ADD_TX_WALLET_ADDRESS",
        "LOOKUP_LP_ADD_TX_WALLET_ADDRESS",
        "CHECK_LP_ADD_TX_WALLET_ADDRESS",
        "GET_LP_ADD_TX_WALLET_BY_ADDRESS",
        "LP_ADD_TX_WALLET_ADDRESS_INFO",
        "WALLET_ADDRESS_LOOKUP_LP_ADD_TX",
        "WALLET_ADDRESS_SEARCH_LP_ADD_TX",
        "WALLET_ADDRESS_CHECK_LP_ADD_TX",
        "WALLET_ADDRESS_DETAILS_LP_ADD_TX",
        "WALLET_CONTRACT_SEARCH_LP_ADD_TX",
        "WALLET_CONTRACT_LOOKUP_LP_ADD_TX",
        "WALLET_CONTRACT_INFO_LP_ADD_TX",
        "WALLET_CONTRACT_CHECK_LP_ADD_TX",
        "VERIFY_WALLET_ADDRESS_LP_ADD_TX",
        "VALIDATE_WALLET_ADDRESS_LP_PROVIDE_TX",
        "GET_WALLET_INFO_LP_PROVIDE_TX",
        "WALLET_INFO_LP_PROVIDE_TX",
        "WALLET_REPORT_LP_PROVIDE_TX",
        "WALLET_ANALYSIS_LP_PROVIDE_TX",
        "WALLET_OVERVIEW_LP_PROVIDE_TX",
        "WALLET_SUMMARY_LP_PROVIDE_TX",
        "WALLET_INSIGHT_LP_PROVIDE_TX",
        "WALLET_DATA_LP_PROVIDE_TX",
        "WALLET_STATS_LP_PROVIDE_TX",
        "WALLET_METRICS_LP_PROVIDE_TX",
        "WALLET_PROFILE_LP_PROVIDE_TX",
        "WALLET_REVIEW_LP_PROVIDE_TX",
        "WALLET_CHECK_LP_PROVIDE_TX",
        "WALLET_LOOKUP_LP_PROVIDE_TX",
        "WALLET_FIND_LP_PROVIDE_TX",
        "WALLET_DISCOVER_LP_PROVIDE_TX",
        "WALLET_EXPLORE_LP_PROVIDE_TX",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const addresses = extractAddresses(message.content.text);
        return addresses.length > 0;
    },
    description: "get liquidity add transactions by wallet.",
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

            // For getting liquidity providing transctions up to 100 for first wallet
            const pairAddresses = findLpPairAddresses(addresses[0], result[0])

            const resultsTxs: BirdeyeApiResponse[] = await Promise.all(
                addresses.map(async (address, i) => {
                    return provider.fetchDefiTradesPair(
                        {
                            address: address,
                            tx_type: "add",
                            offset: 0,
                            limit: 100,
                            sort_type: "desc"
                        }
                    );
                })
            );


            const completeResults = `I performed a search of liquidity providing transctions for the wallet addresses you requested and found the following results:\n\n${resultsTxs
                .map(
                    (resultTx, i) =>
                        `${formatTransctionsReport(addresses[0], resultTx)}`
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
                    text: "I want to see LP transactions in my wallet"
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Getting all lp transcations",
                    action: "GET_LP_TRANSACTIONS",
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


const findLpPairAddresses = (
    address: string,
    result: BirdeyeApiResponse
) => {
    let lpPairAddresses = [];
    const tokens = result.data.items || [];

    // Filter only LP tokens
    const tokenList = tokens.filter(token => token.icon == undefined);

    // Collect only address attributes from tokens
    tokenList.map(({address}, index) =>
        lpPairAddresses.push(address);
    )

    return lpPairAddresses;
};


const formatTransctionsReport = (
    address: string,
    result: BirdeyeApiResponse
) => {
    const txs = result.data.solana || [];

    let header = `Add LP Transctions Result  : }\n`;
    header += `👛 Address ${address}*\n`;

    // Filter only LP tokens
    const txList = txs.filter(tx => tx.from == address);

    // Tokens Array to String
    txList.map(
            (tx) =>
                `• ${tx.txHash} \n`
        )
        .join("\n");

    return `${header}\n${txList}`;
};
