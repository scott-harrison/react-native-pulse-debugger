import { BrowserWindow } from 'electron';
import { WebSocketServer as Server, WebSocket } from 'ws';

export function startWebSocketServer(win: BrowserWindow) {
	console.log('Starting websocket server');
	const wss = new Server({ port: 8973 });

	wss.on('connection', (ws: WebSocket) => {
		console.log('WebSocket client connected');

		// Handle incoming messages
		ws.on('message', (message: Buffer) => {
			const messageStr = message.toString();
			console.log('Received:', messageStr);
			win.webContents.send('pulse-event', messageStr);
		});

		// Handle client disconnection
		ws.on('close', () => {
			console.log('WebSocket client disconnected');
			win.webContents.send('pulse-device-disconnection');
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
