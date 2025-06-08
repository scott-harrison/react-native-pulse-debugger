import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import PulseDebugger from '@react-native-pulse-debugger/lib';

export default function App() {
	const handleTestLog = () => {
		PulseDebugger.log('info', 'Test log message', { test: true });
	};

	const handleTestNetwork = () => {
		PulseDebugger.trackNetworkRequest({
			method: 'GET',
			url: 'https://api.example.com/test',
			headers: { 'Content-Type': 'application/json' },
		});
	};

	const handleTestRedux = () => {
		PulseDebugger.trackReduxAction({
			type: 'TEST_ACTION',
			payload: { test: true },
		});
		PulseDebugger.trackReduxState({ test: true });
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>React Native Pulse Debugger</Text>
			<Text style={styles.subtitle}>Example App</Text>

			<View style={styles.buttonContainer}>
				<Button title="Test Log" onPress={handleTestLog} />
				<View style={styles.buttonSpacer} />
				<Button title="Test Network" onPress={handleTestNetwork} />
				<View style={styles.buttonSpacer} />
				<Button title="Test Redux" onPress={handleTestRedux} />
			</View>

			<StatusBar style="auto" />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		marginBottom: 32,
	},
	buttonContainer: {
		width: '100%',
		maxWidth: 300,
	},
	buttonSpacer: {
		height: 12,
	},
});
