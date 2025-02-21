import type { Plugin } from "@elizaos/core";

import { getWalletLPTokens } from "./actions/getWalletLPTokens.ts";
export const lpPnlPlugin: Plugin = {
    name: "Raydidum lp pnl",
    description: "Raydium LP PNL Plugin for Eliza",
    actions: [
        getWalletLPTokens
    ],
    evaluators: [],
    providers: [],
};
