declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                on: (
                    channel: string,
                    listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
                ) => void;
                once: (
                    channel: string,
                    listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
                ) => void;
                removeAllListeners: (channel: string) => void;
                sendMessage: (channel: string, ...args: unknown[]) => void;
                invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
            };
        };
    }
}

export {};
