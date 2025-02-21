import type { BirdeyeApiParams } from "./types";
export const extractAddresses = (text: string): string[] => {
    let addresses = [];

    // Solana addresses (base58 strings)
    const solAddresses = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
    if (solAddresses) {
        addresses.push(
            ...solAddresses.map((address) => ({
                address
            }))
        );
    }

    return addresses;
};

export const waitFor = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export const convertToStringParams = (params: BirdeyeApiParams) => {
    return Object.entries(params || {}).reduce(
        (acc, [key, value]) => ({
            ...acc,
            [key]: value?.toString() || "",
        }),
        {} as Record<string, string>
    );
};