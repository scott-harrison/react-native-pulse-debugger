import { validators } from '../validators';
import { OutgoingEventType, IncomingEventType } from '../enums/events';

describe('Message Validators', () => {
  describe('REDUX_STATE_UPDATE validator', () => {
    test('should validate correct redux state format', () => {
      const payload = {
        state: {
          count: 1,
        },
      };

      expect(
        validators[OutgoingEventType.REDUX_STATE_UPDATE](payload).isValid
      ).toBe(true);
    });

    test('should reject invalid redux state format', () => {
      const invalidPayloads = [
        null,
        {},
        { state: null },
        { state: 'not an object' },
      ];

      invalidPayloads.forEach((payload) => {
        const result =
          validators[OutgoingEventType.REDUX_STATE_UPDATE](payload);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('NETWORK_REQUEST validator', () => {
    test('should validate correct network request format', () => {
      const validPayloads = [
        {},
        { url: 'https://api.example.com' },
        { method: 'GET' },
        { headers: { 'Content-Type': 'application/json' } },
        {
          url: 'https://api.example.com',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      ];

      validPayloads.forEach((payload) => {
        expect(
          validators[OutgoingEventType.NETWORK_REQUEST](payload).isValid
        ).toBe(true);
      });
    });

    test('should reject invalid network request format', () => {
      const invalidPayloads = [
        null,
        { url: 123 }, // url should be string
        { method: 123 }, // method should be string
        { headers: 'not an object' }, // headers should be object
      ];

      invalidPayloads.forEach((payload) => {
        const result = validators[OutgoingEventType.NETWORK_REQUEST](payload);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('CONSOLE validator', () => {
    test('should validate any payload', () => {
      const payloads = [{}, { message: 'test' }, { level: 'info' }, null];

      payloads.forEach((payload) => {
        expect(validators[OutgoingEventType.CONSOLE](payload).isValid).toBe(
          true
        );
      });
    });
  });

  describe('REDUX_ACTION validator', () => {
    test('should validate any payload', () => {
      const payloads = [{}, { type: 'TEST' }, { payload: 'data' }, null];

      payloads.forEach((payload) => {
        expect(
          validators[OutgoingEventType.REDUX_ACTION](payload).isValid
        ).toBe(true);
      });
    });
  });

  describe('Incoming event validators', () => {
    test('should validate REDUX_STATE_REQUEST', () => {
      expect(
        validators[IncomingEventType.REDUX_STATE_REQUEST](null).isValid
      ).toBe(true);
    });
  });
});
