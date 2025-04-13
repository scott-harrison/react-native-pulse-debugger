/**
 * Network request interface
 */
export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
}

/**
 * Network response interface
 */
export interface NetworkResponse {
  id: string;
  status: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  duration?: number;
}
