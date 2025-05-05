import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/sidebar';

const DebuggerLayout = () => {
	return (
		<div className="flex h-full">
			<Sidebar />
			{/* Main Content */}
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
};

export default DebuggerLayout;
