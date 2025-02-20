import type { Plugin } from "@elizaos/core";

import { getWalletTokens } from "./actions/getWalletTokens.ts";
export const lpPnlPlugin: Plugin = {
    name: "Raydidum lp pnl",
    description: "Raydium LP PNL Plugin for Eliza",
    actions: [
        getWalletTokens
    ],
    evaluators: [],
    providers: [],
};
