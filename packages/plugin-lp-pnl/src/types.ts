export interface TokenType {
    name?: string;
    symbol?:string;
    address: string;
    balance: number;
    uiAmount: number;
    decimals: number;
    priceUsd?: number;
    icon?: string;
}

export interface BirdeyeApiResponseWrapper<T> {
    data: T;
    success: boolean;
}

export type BirdeyeApiResponse = BirdeyeApiResponseWrapper<any>

export interface WalletPortfolioParams {
    wallet: string;
}

export type BirdeyeApiParams = WalletPortfolioParams | Record<string, never>;