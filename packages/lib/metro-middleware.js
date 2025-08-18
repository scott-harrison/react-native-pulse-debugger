// metro-middleware.js
const os = require('os');

function pulseDebuggerMiddleware(req, res, next) {
    if (req.url === '/__pulse_debugger__/host') {
        try {
            const addressInfo = req.socket.server.address();
            let host = addressInfo.address;

            if (host === '::' || host === '0.0.0.0') {
                const interfaces = os.networkInterfaces();
                let candidates = [];
                for (const name of Object.keys(interfaces)) {
                    for (const iface of interfaces[name]) {
                        if (iface.family === 'IPv4' && !iface.internal) {
                            candidates.push(iface.address);
                        }
                    }
                }

                // Prioritize LAN-like addresses
                candidates.sort((a, b) => (a.startsWith('192.') ? -1 : 1));
                host = candidates[0] || 'localhost';
            }

            if (host.includes(':')) host = `[${host}]`; // IPv6 handling

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
                JSON.stringify(
                    {
                        host,
                        port: 8973,
                        metroPort: addressInfo.port,
                        success: true,
                    },
                    null,
                    2
                )
            );

            return;
        } catch (e) {
            res.statusCode = 500;
            return res.end(
                JSON.stringify(
                    { success: false, error: 'Failed to get host', message: e.message },
                    null,
                    2
                )
            );
        }
    }

    // CORS preflight
    if (req.method === 'OPTIONS' && req.url.startsWith('/__pulse_debugger__/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 200;
        res.end();
        return;
    }

    next();
}

module.exports = pulseDebuggerMiddleware;
