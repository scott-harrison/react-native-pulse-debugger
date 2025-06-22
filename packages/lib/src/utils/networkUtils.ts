interface ConstantsModule {
    expoConfig?: {
        name?: string;
        hostUri?: string;
        version?: string;
        ios?: { buildNumber?: string };
        android?: { versionCode?: string };
    };
    manifest2?: { id?: string };
}

let Constants: ConstantsModule | null;
try {
    Constants = require('expo-constants').default;
} catch (e) {
    Constants = null;
}

export const getDevelopmentHost = async () => {
    if (Constants) {
        const host = Constants.expoConfig?.hostUri?.split(':')[0];
        const port = 8973;

        if (!host || !port) {
            throw new Error(
                'Was unable to discover the host and port for the Pulse debugger. Please set in initializePulse config host and port'
            );
        }

        return {
            host,
            port,
        };
    }

    try {
        const response = await fetch(`http://localhost:8081/__pulse_debugger__/host`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON response but got: ${contentType}`);
        }

        const data = await response.json();
        console.log('✅ Pulse debugger host detected:', data.host, data.port);
        return data;
    } catch (error) {
        console.log(error);
    }
};
