import React from 'react';
import ReduxStatePanel from './components/ReduxStatePanel';
import ActionHistoryPanel from './components/ActionHistoryPanel';
import { useReduxStore } from '@/store/reduxStore';
import useSessionStore from '@/store/sessionStore';

const ReduxScreen: React.FC = () => {
	const sessionId = useSessionStore(state => state.currentSessionId);
	const { states, actions, clearReduxBySessionId } = useReduxStore();
	const reduxState = states.find(s => s.sessionId === sessionId);
	const reduxActions = actions.filter(a => a.sessionId === sessionId);

	return (
		<div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
			<ReduxStatePanel reduxState={reduxState} />
			<ActionHistoryPanel
				actions={reduxActions}
				onClearActions={() => sessionId && clearReduxBySessionId(sessionId)}
			/>
		</div>
	);
};

export default ReduxScreen;
