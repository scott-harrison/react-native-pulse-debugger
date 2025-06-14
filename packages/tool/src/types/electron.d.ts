declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
                once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
                removeAllListeners: (channel: string) => void;
                sendMessage: (channel: string, ...args: unknown[]) => void;
                invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
            };
        };
    }
}

export {};
