import { ConnectionManager } from '../connectionManager';
import { MockWebSocket } from './mocks/MockWebSocket';
import { LibToDebuggerEventType } from '@pulse/shared-types';

(global as any).WebSocket = MockWebSocket;

describe('EventManager', () => {
  let connectionManager: ConnectionManager;
  const TEST_URL = 'ws://localhost:8080';

  beforeEach(() => {
    MockWebSocket.instances = [];

    connectionManager = new ConnectionManager({ url: TEST_URL });
    connectionManager.connect();
    MockWebSocket.instances[0]?.simulateOpen();
  });

  afterEach(() => {
    connectionManager.stop();
    MockWebSocket.instances = [];
  });

  describe('Message Sending', () => {
    test('should format and send messages correctly', () => {
      const testPayload = { key: 'value' };
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();
      expect(eventManager).not.toBeNull();
      if (!eventManager) return;

      eventManager.emit(LibToDebuggerEventType.REDUX_ACTION, testPayload);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: LibToDebuggerEventType.REDUX_ACTION,
          payload: testPayload,
        })
      );
    });

    test('should handle null/undefined payloads', () => {
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();
      expect(eventManager).not.toBeNull();
      if (!eventManager) return;

      eventManager.emit(LibToDebuggerEventType.REDUX_ACTION, null);
      eventManager.emit(LibToDebuggerEventType.REDUX_ACTION, undefined);

      expect(sendSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          type: LibToDebuggerEventType.REDUX_ACTION,
          payload: null,
        })
      );
      expect(sendSpy).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          type: LibToDebuggerEventType.REDUX_ACTION,
          payload: undefined,
        })
      );
    });

    test('should handle complex payload types', () => {
      const complexPayload = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        nested: {
          key: 'value',
        },
      };
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();
      expect(eventManager).not.toBeNull();
      if (!eventManager) return;

      eventManager.emit(LibToDebuggerEventType.REDUX_ACTION, complexPayload);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: LibToDebuggerEventType.REDUX_ACTION,
          payload: complexPayload,
        })
      );
    });

    test('should not send when connection is closed', () => {
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();
      expect(eventManager).not.toBeNull();
      if (!eventManager) return;
      MockWebSocket.instances[0]?.simulateClose();

      eventManager.emit(LibToDebuggerEventType.REDUX_ACTION, { key: 'value' });

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});
