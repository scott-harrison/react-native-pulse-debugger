import { ConnectionManager } from '../connectionManager';
import { OutgoingEventType } from '../enums/events';
import { MockWebSocket } from './mocks/MockWebSocket';

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('EventManager', () => {
  let connectionManager: ConnectionManager;
  const TEST_URL = 'ws://localhost:8080';

  beforeEach(() => {
    // Clear mock instances
    MockWebSocket.instances = [];

    // Create connection manager and connect
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

      eventManager.emit(OutgoingEventType.REDUX_ACTION, testPayload);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: OutgoingEventType.REDUX_ACTION,
          payload: testPayload,
        })
      );
    });

    test('should handle null/undefined payloads', () => {
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();

      eventManager.emit(OutgoingEventType.REDUX_ACTION, null);
      eventManager.emit(OutgoingEventType.REDUX_ACTION, undefined);

      expect(sendSpy).toHaveBeenNthCalledWith(
        1,
        JSON.stringify({
          type: OutgoingEventType.REDUX_ACTION,
          payload: null,
        })
      );
      expect(sendSpy).toHaveBeenNthCalledWith(
        2,
        JSON.stringify({
          type: OutgoingEventType.REDUX_ACTION,
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

      eventManager.emit(OutgoingEventType.REDUX_ACTION, complexPayload);

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          type: OutgoingEventType.REDUX_ACTION,
          payload: complexPayload,
        })
      );
    });

    test('should not send when connection is closed', () => {
      const sendSpy = jest.spyOn(MockWebSocket.instances[0]!, 'send');
      const eventManager = connectionManager.getEventManager();
      MockWebSocket.instances[0]?.simulateClose();

      eventManager.emit(OutgoingEventType.REDUX_ACTION, { key: 'value' });

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });
});
