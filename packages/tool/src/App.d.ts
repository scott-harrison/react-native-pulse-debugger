export {};

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                on: (
                    channel: string,
                    listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
                ) => void;
                removeAllListeners: (channel: string) => void;
            };
        };
    }
}
