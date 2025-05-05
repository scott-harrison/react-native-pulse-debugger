import { Activity } from 'lucide-react';
import { Outlet, NavLink } from 'react-router-dom';
import pkg from '../../package.json';
import Sidebar from '@/components/sidebar';

const DebuggerLayout = () => {
	return (
		<div className="flex h-full">
			<Sidebar />
			{/* Main Content */}
			<main className="flex-1 bg-gray-900 text-white p-6">
				<Outlet />
			</main>
		</div>
	);
};

export default DebuggerLayout;
