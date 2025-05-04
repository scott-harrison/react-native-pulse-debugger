import { useEffect, useState } from 'react';
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
import { createStore } from './store';
import { useAppDispatch, useAppSelector } from './hooks';
import {
  increment,
  decrement,
  incrementByAmount,
  incrementAsync,
  incrementAsyncSuccess,
} from './features/counter/counterSlice';
import {
  getPulseState,
  type ConnectionState,
  pulseDebugger,
} from '@pulse/debugger-lib';

// Configure the debugger
pulseDebugger.configure({
  port: 8973,
  enableConsole: true,
  enableNetwork: true,
});

// Create the store after configuring the debugger
const store = createStore();

function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const status = useAppSelector((state) => state.counter.status);
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionState>('disconnected');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setConnectionStatus(getPulseState());
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

    // Simulate async operation with timeout
    setTimeout(() => {
      dispatch(incrementAsyncSuccess());
      addLog('Completed async increment');
    }, 2000); // 2 second delay to show loading state
  };

  const handleTestNetwork = async (isSlow = false) => {
    try {
      addLog('Sending network request...');

      const url = isSlow
        ? 'http://slowwly.robertomurray.co.uk/delay/2500/url/https://jsonplaceholder.typicode.com/posts/1'
        : 'https://jsonplaceholder.typicode.com/posts/1';

      const response = await fetch(url);
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
      {/* Header with gradient-like appearance */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Pulse Debugger</Text>
          <View style={[styles.status, statusStyles[connectionStatus]]}>
            <Text style={styles.statusText}>
              {connectionStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Counter section */}
      <View style={styles.counterContainer}>
        <View style={styles.counterHeader}>
          <Text style={styles.sectionTitle}>Counter</Text>
          <Text
            style={[
              styles.statusBadge,
              status === 'loading'
                ? { backgroundColor: '#FFF9C4', color: '#F57F17' }
                : status === 'failed'
                  ? { backgroundColor: '#FFEBEE', color: '#D32F2F' }
                  : { backgroundColor: '#E1F5FE', color: '#0277BD' },
            ]}
          >
            Status: {status}
          </Text>
        </View>
        <Text style={styles.counterValue}>{count}</Text>

        <View style={styles.counterActions}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleDecrement}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleIncrement}
          >
            <Text style={styles.counterButtonText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.counterButton, { backgroundColor: '#E3F2FD' }]}
            onPress={handleIncrementByAmount}
          >
            <Text style={[styles.counterButtonText, { color: '#1976D2' }]}>
              +5
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.counterButton,
              styles.textButton,
              { backgroundColor: '#E1F5FE' },
            ]}
            onPress={handleIncrementAsync}
          >
            <Text style={[styles.counterButtonText, { color: '#0288D1' }]}>
              Async
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test actions section */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Testing Tools</Text>

        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Network</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.networkButton]}
            onPress={() => handleTestNetwork(false)}
          >
            <Text style={styles.actionButtonText}>Test Network</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.networkButton]}
            onPress={() => handleTestNetwork(true)}
          >
            <Text style={styles.actionButtonText}>Test Slow Network</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Console</Text>
          <View style={styles.actionButtonGrid}>
            <TouchableOpacity
              style={[styles.actionButton, styles.consoleLogButton]}
              onPress={handleTestConsoleLog}
            >
              <Text style={styles.actionButtonText}>Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.consoleWarnButton]}
              onPress={handleTestConsoleWarn}
            >
              <Text style={styles.actionButtonText}>Warn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.consoleErrorButton]}
              onPress={handleTestConsoleError}
            >
              <Text style={styles.actionButtonText}>Error</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.consoleDebugButton]}
              onPress={handleTestConsoleDebug}
            >
              <Text style={styles.actionButtonText}>Debug</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupTitle}>Error Handling</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.errorButton]}
            onPress={handleTestError}
          >
            <Text style={styles.actionButtonText}>Trigger Error</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs section */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
        </View>
        <View style={styles.logsList}>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogText}>No events recorded yet</Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <View style={styles.logDot} />
                <Text style={styles.logText}>{log}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Counter />
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: '#3F51B5',
    borderRadius: 16,
    marginBottom: 24,
    padding: 2,
    overflow: 'hidden',
  },
  headerContent: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3F51B5',
  },
  status: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  counterContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#0277BD',
    fontSize: 12,
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3F51B5',
    textAlign: 'center',
    marginBottom: 20,
  },
  counterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  counterButton: {
    backgroundColor: '#3F51B5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  textButton: {
    width: 90,
    borderRadius: 24,
    paddingHorizontal: 10,
  },
  counterButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionsContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionGroup: {
    marginTop: 16,
  },
  actionGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  actionButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minWidth: 100,
  },
  networkButton: {
    backgroundColor: '#E8F5E9',
  },
  consoleLogButton: {
    backgroundColor: '#EDE7F6',
  },
  consoleWarnButton: {
    backgroundColor: '#FFF3E0',
  },
  consoleErrorButton: {
    backgroundColor: '#FFEBEE',
  },
  consoleDebugButton: {
    backgroundColor: '#E0F7FA',
  },
  errorButton: {
    backgroundColor: '#FFEBEE',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  logsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  logsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logsList: {
    padding: 16,
  },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3F51B5',
    marginRight: 10,
  },
  logText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  emptyLogText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

const statusStyles: Record<ConnectionState, { backgroundColor: string }> = {
  connecting: { backgroundColor: '#FF9800' },
  connected: { backgroundColor: '#4CAF50' },
  disconnected: { backgroundColor: '#F44336' },
  error: { backgroundColor: '#D32F2F' },
};
