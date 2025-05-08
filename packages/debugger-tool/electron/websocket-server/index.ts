import { BrowserWindow } from 'electron';
import { WebSocketServer as Server, WebSocket } from 'ws';
import { parse } from 'url';

export function startWebSocketServer(win: BrowserWindow) {
	console.log('Starting websocket server');
	const wss = new Server({ port: 8973 });

	wss.on('connection', (ws: WebSocket, req) => {
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
			win.webContents.send('pulse-device-disconnection', { id: sessionId });
		});

		// Handle errors
		ws.on('error', error => {
			console.error('WebSocket client error:', error);
		});
	});

	wss.on('error', error => {
		console.error('WebSocket server error:', error);
	});

	console.log('WebSocket server running on ws://localhost:8379');
}
