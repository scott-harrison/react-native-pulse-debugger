import { PulseDebugger } from '../index';

type RequestInfo = Request | string | URL;

export class NetworkInterceptor {
  private originalFetch: typeof fetch;
  private pulse: PulseDebugger;

  constructor(pulse: PulseDebugger) {
    this.pulse = pulse;
    this.originalFetch = global.fetch;
  }

  private async interceptRequest(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    const request = new Request(input, init);
    const requestData = {
      id: requestId,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await this.getRequestBody(request),
      timestamp: startTime,
    };

    try {
      if (this.pulse.isNetworkMonitoringEnabled()) {
        this.pulse.sendNetworkRequestEvent({
          type: 'request',
          ...requestData,
        });
      }

      const response = await this.originalFetch(request);

      const responseClone = response.clone();

      const responseData = {
        id: requestId,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: await this.getResponseBody(responseClone),
        duration: Date.now() - startTime,
      };

      if (this.pulse.isNetworkMonitoringEnabled()) {
        this.pulse.sendNetworkResponseEvent({
          type: 'response',
          ...responseData,
        });
      }

      return response;
    } catch (error) {
      if (this.pulse.isNetworkMonitoringEnabled()) {
        this.pulse.sendNetworkErrorEvent({
          type: 'error',
          id: requestId,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
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
