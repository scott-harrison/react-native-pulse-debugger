import { BrowserWindow } from 'electron';
import { WebSocketServer as Server, WebSocket } from 'ws';
import { parse } from 'url';

export function startWebSocketServer(win: BrowserWindow) {
	console.log('Starting websocket server');
	const wss = new Server({ port: 8973 });

	// Maintain a list of connected clients
	const clients: Set<WebSocket> = new Set();

	wss.on('connection', (ws: WebSocket, req) => {
		clients.add(ws); // Add the client to the set
		const { id: sessionId, ...deviceInfo } = parse(req.url || '', true).query;
		console.log(`WebSocket client connected - ${sessionId} - ${deviceInfo}`);
		win.webContents.send('pulse-connection', { sessionId: sessionId, deviceInfo });

		// Handle incoming messages
		ws.on('message', (message: Buffer) => {
			const messageStr = message.toString();
			console.log('Received:', messageStr);
			win.webContents.send('pulse-event', messageStr);
		});

		// Handle client disconnection
		ws.on('close', () => {
			console.log('WebSocket client disconnected');
			clients.delete(ws); // Remove the client from the set
			win.webContents.send('pulse-device-disconnection', { id: sessionId });
		});

		// Handle errors
		ws.on('error', error => {
			console.error('WebSocket client error:', error);
			clients.delete(ws); // Remove the client from the set on error
		});
	});

	wss.on('error', error => {
		console.error('WebSocket server error:', error);
	});

	// Broadcast a reconnect message to all connected clients
	const broadcastReconnect = () => {
		console.log('Broadcasting reconnect message to all clients');
		clients.forEach(client => {
			client.send(JSON.stringify({ type: 'reconnect' }));
		});
	};

	// Trigger reconnect broadcast when the debugger tool reloads
	win.webContents.on('did-finish-load', () => {
		broadcastReconnect();
	});

	console.log('WebSocket server running on ws://localhost:8379');
}
