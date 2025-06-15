import { generateUUID } from '@react-native-pulse-debugger/utils';
import { PulseDebugger } from '../index';
import { NetworkPayload } from '@react-native-pulse-debugger/types';

type RequestInfo = Request | string | URL;

export class NetworkInterceptor {
    private originalFetch: typeof fetch;
    private pulse: PulseDebugger;

    constructor(pulse: PulseDebugger) {
        this.pulse = pulse;
        this.originalFetch = global.fetch;
    }

    private isBlacklisted(url: string): boolean {
        const config = this.pulse.getConfig();
        const blacklist = config?.networkBlacklist;

        if (!blacklist) return false;

        // Check if the URL matches any blacklisted patterns
        debugger;
        if (blacklist?.length) {
            return blacklist.some(pattern => {
                try {
                    const regex = new RegExp(pattern);
                    return regex.test(url);
                } catch {
                    // If pattern is invalid, treat it as a simple string match
                    return url.includes(pattern);
                }
            });
        }

        return false;
    }

    private async interceptRequest(input: RequestInfo, init?: RequestInit): Promise<Response> {
        const startTime = Date.now();
        const requestId = generateUUID();

        const request = new Request(input, init);
        let payload: NetworkPayload = {
            requestId,
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: await this.getRequestBody(request),
            requestStatus: 'pending',
            startTime,
        };

        try {
            if (this.pulse.isNetworkMonitoringEnabled() && !this.isBlacklisted(request.url)) {
                this.pulse.sendNetworkEvent(payload);
            }

            const response = await this.originalFetch(request);
            const responseClone = response.clone();

            payload.requestStatus = 'fulfilled';
            payload.response = {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: await this.getResponseBody(responseClone),
                error: undefined,
                duration: Date.now() - startTime,
                startTime,
                endTime: Date.now(),
            };

            if (this.pulse.isNetworkMonitoringEnabled() && !this.isBlacklisted(request.url)) {
                this.pulse.sendNetworkEvent(payload);
            }

            return response;
        } catch (error) {
            if (!this.isBlacklisted(request.url)) {
                payload.requestStatus = 'rejected';
                this.pulse.sendNetworkEvent({
                    ...payload,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
            throw error;
        }
    }

    private async getRequestBody(request: Request): Promise<any> {
        try {
            const clone = request.clone();
            const text = await clone.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch {
            return null;
        }
    }

    private async getResponseBody(response: Response): Promise<any> {
        try {
            const text = await response.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch {
            return null;
        }
    }

    intercept(): void {
        global.fetch = this.interceptRequest.bind(this);
    }

    restore(): void {
        global.fetch = this.originalFetch;
    }
}
