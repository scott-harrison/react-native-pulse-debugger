export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type EventHandler<T = unknown> = (payload: T) => void;

export interface EventMessage<T = unknown> {
  type: string;
  payload: T;
}
