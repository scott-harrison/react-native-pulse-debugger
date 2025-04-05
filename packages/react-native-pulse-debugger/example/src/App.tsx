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
import { initializePulse, getPulse } from 'react-native-pulse-debugger';
import type { ConnectionStatus } from 'react-native-pulse-debugger';

// Initialize Pulse Debugger
initializePulse({
  host: 'localhost',
  port: 8080,
  autoConnect: true,
  retryInterval: 5000,
});

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
    marginBottom: 10,
  },
  logText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

type StatusStyles = {
  [key in ConnectionStatus]: {
    backgroundColor: string;
  };
};

const statusStyles: StatusStyles = {
  connecting: { backgroundColor: '#FFA500' },
  connected: { backgroundColor: '#4CAF50' },
  disconnected: { backgroundColor: '#FF5252' },
  error: { backgroundColor: '#FF5252' },
};
