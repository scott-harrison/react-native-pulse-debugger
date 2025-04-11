import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { useAppDispatch, useAppSelector } from './app/hooks';
import {
  increment,
  decrement,
  incrementByAmount,
  incrementAsync,
} from './features/counter/counterSlice';
import {
  initializePulse,
  getPulse,
  pulseNetworkMiddleware,
  pulseConsoleMiddleware,
} from 'react-native-pulse-debugger';
import type { ConnectionStatus } from 'react-native-pulse-debugger';

// Initialize Pulse Debugger
initializePulse({
  host: 'localhost',
  port: 8973,
  autoConnect: true,
  retryInterval: 5000,
});

// Disable event batching to prevent duplicate messages
const pulse = getPulse();
if (pulse) {
  pulse.updateEventConfig({
    enableBatching: false,
    enableThrottling: false,
  });
}

// Apply network middleware
global.fetch = pulseNetworkMiddleware(fetch);

// Apply console middleware
global.console = pulseConsoleMiddleware(console);

function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const status = useAppSelector((state) => state.counter.status);
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const pulse = getPulse();
    if (pulse) {
      setConnectionStatus(pulse.getStatus());
    }
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 5));
  };

  const handleIncrement = () => {
    dispatch(increment());
    addLog('Incremented counter');
  };

  const handleDecrement = () => {
    dispatch(decrement());
    addLog('Decremented counter');
  };

  const handleIncrementByAmount = () => {
    dispatch(incrementByAmount(5));
    addLog('Incremented counter by 5');
  };

  const handleIncrementAsync = () => {
    dispatch(incrementAsync());
    addLog('Started async increment');
  };

  const handleTestNetwork = async () => {
    try {
      addLog('Sending network request...');
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/posts/1'
      );
      const data = await response.json();
      addLog(`Network request successful: ${data.title.substring(0, 20)}...`);
    } catch (error) {
      addLog(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const handleTestConsoleLog = () => {
    console.log('This is a regular log message');
    addLog('Sent test console log message');
  };

  const handleTestConsoleWarn = () => {
    console.warn('This is a warning message', [1, 2, 3]);
    addLog('Sent test console warn message');
  };

  const handleTestConsoleError = () => {
    console.error('An error occurred:', new Error('Test error'));
    addLog('Sent test console error message');
  };

  const handleTestConsoleDebug = () => {
    console.debug('This is a debug message', { nested: { data: true } });
    addLog('Sent test console debug message');
  };

  const handleTestError = () => {
    try {
      // Simulate an error
      const obj: any = null;
      obj.nonExistentMethod();
    } catch (error) {
      console.error('An error occurred:', error);
      addLog('Triggered test error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pulse Debugger Example</Text>
        <View style={[styles.status, statusStyles[connectionStatus]]}>
          <Text style={styles.statusText}>
            {connectionStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counterTitle}>Counter: {count}</Text>
        <Text style={styles.statusText}>Status: {status}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleIncrement}>
          <Text style={styles.buttonText}>Increment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleDecrement}>
          <Text style={styles.buttonText}>Decrement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleIncrementByAmount}
        >
          <Text style={styles.buttonText}>Add 5</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleIncrementAsync}>
          <Text style={styles.buttonText}>Async Increment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.networkButton]}
          onPress={handleTestNetwork}
        >
          <Text style={styles.buttonText}>Test Network</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.consoleButton]}
          onPress={handleTestConsoleWarn}
        >
          <Text style={styles.buttonText}>Test Console Warn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.consoleButton]}
          onPress={handleTestConsoleLog}
        >
          <Text style={styles.buttonText}>Test Console Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.consoleButton]}
          onPress={handleTestConsoleError}
        >
          <Text style={styles.buttonText}>Test Console Error</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.consoleButton]}
          onPress={handleTestConsoleDebug}
        >
          <Text style={styles.buttonText}>Test Console Debug</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.errorButton]}
          onPress={handleTestError}
        >
          <Text style={styles.buttonText}>Test Error</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.logsTitle}>Recent Events:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Counter />
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
  },
  counterContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  counterTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  networkButton: {
    backgroundColor: '#34C759',
  },
  consoleButton: {
    backgroundColor: '#5856D6',
  },
  errorButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  logText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

const statusStyles: Record<ConnectionStatus, { backgroundColor: string }> = {
  connecting: { backgroundColor: '#FF9500' },
  connected: { backgroundColor: '#34C759' },
  disconnected: { backgroundColor: '#FF3B30' },
  error: { backgroundColor: '#FF3B30' },
};
