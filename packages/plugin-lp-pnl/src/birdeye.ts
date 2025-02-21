import { elizaLogger, type ICacheManager, settings } from "@elizaos/core";
import NodeCache from "node-cache";
import * as path from "node:path";
import {
    API_BASE_URL,
    BIRDEYE_ENDPOINTS,
    DEFAULT_MAX_RETRIES,
    RETRY_DELAY_MS,
} from "./constants";
import type { BirdeyeApiParams, BirdeyeApiResponse } from "./types";
import { convertToStringParams, waitFor } from "./utils";

class BaseCachedProvider {
    private cache: NodeCache;

    constructor(
        private cacheManager: ICacheManager,
        private cacheKey,
        ttl?: number
    ) {
        this.cache = new NodeCache({ stdTTL: ttl || 300 });
    }

    private readFsCache<T>(key: string): Promise<T | null> {
        return this.cacheManager.get<T>(path.join(this.cacheKey, key));
    }

    private writeFsCache<T>(key: string, data: T): Promise<void> {
        return this.cacheManager.set(path.join(this.cacheKey, key), data, {
            expires: Date.now() + 5 * 60 * 1000,
        });
    }

    public async readFromCache<T>(key: string): Promise<T | null> {
        // get memory cache first
        const val = this.cache.get<T>(key);
        if (val) {
            return val;
        }

        const fsVal = await this.readFsCache<T>(key);
        if (fsVal) {
            // set to memory cache
            this.cache.set(key, fsVal);
        }

        return fsVal;
    }

    public async writeToCache<T>(key: string, val: T): Promise<void> {
        // Set in-memory cache
        this.cache.set(key, val);

        // Write to file-based cache
        await this.writeFsCache(key, val);
    }
}

export class BirdeyeProvider extends BaseCachedProvider {
    private maxRetries: number;

    constructor(
        cacheManager: ICacheManager,
        maxRetries?: number
    ) {
        super(cacheManager, "birdeye/data");
        this.maxRetries = maxRetries || DEFAULT_MAX_RETRIES;
    }

    /*
     * COMMON FETCH FUNCTIONS
     */
    private async fetchWithRetry<T extends BirdeyeApiResponse>(
        url: string,
        options: RequestInit = {}
    ): Promise<T> {
        let attempts = 0;

        // allow the user to override the chain
        const chain = "solana";

        while (attempts < this.maxRetries) {
            attempts++;
            try {
                const resp = await fetch(url, {
                    ...options,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "x-chain": chain,
                        "X-API-KEY": settings.BIRDEYE_API_KEY || "",
                        ...options.headers,
                    },
                });

                if (!resp.ok) {
                    const errorText = await resp.text();
                    throw new Error(
                        `HTTP error! status: ${resp.status}, message: ${errorText}`
                    );
                }

                const rawData = await resp.json();
                // If the response already has data and success fields, return it
                if (
                    rawData.data !== undefined &&
                    rawData.success !== undefined
                ) {
                    return rawData as T;
                }
                // Otherwise wrap the response in the expected format
                return {
                    data: rawData,
                    success: true,
                } as T;
            } catch (error) {
                if (attempts === this.maxRetries) {
                    // failed after all
                    throw error;
                }
                await waitFor(RETRY_DELAY_MS);
            }
        }
    }

    private async fetchWithCacheAndRetry<T extends BirdeyeApiResponse>({
        url,
        params,
        headers,
        method = "GET",
    }: {
        url: string;
        params?: BirdeyeApiParams;
        headers?: Record<string, string>;
        method?: "GET" | "POST";
    }): Promise<T> {
        const stringParams = convertToStringParams(params);
        const fullUrl = `${API_BASE_URL}${url}`;
        const cacheKey =
            method === "GET"
                ? `${url}?${new URLSearchParams(stringParams)}`
                : `${url}:${JSON.stringify(params)}`;

        const val = await this.readFromCache(cacheKey);
        if (val) return val as T;

        const urlWithParams =
            method === "GET" && params
                ? `${fullUrl}?${new URLSearchParams(stringParams)}`
                : fullUrl;

        elizaLogger.info(`Birdeye fetch: ${urlWithParams}`);

        const data = await this.fetchWithRetry<T>(urlWithParams, {
            method,
            headers,
            ...(method === "POST" &&
                params && { body: JSON.stringify(params) }),
        });

        await this.writeToCache(cacheKey, data);
        return data as T;
    }

    public async fetchWalletPortfolio(
        params: BirdeyeApiParams,
        options: { headers?: Record<string, string> } = {}
    ) {
        return this.fetchWithCacheAndRetry<BirdeyeApiResponse>({
            url: BIRDEYE_ENDPOINTS.wallet.portfolio,
            params,
            headers: options.headers,
        });
    }
}
