import React from 'react';

const ConsoleScreen: React.FC = () => {
	return (
		<div className="flex flex-col items-center p-4">
			<h1 className="text-2xl font-bold mb-4 text-center">Console Debugger</h1>
			<div className="bg-white p-4 rounded-lg shadow-md w-full max-w-2xl">
				<p className="text-base text-gray-700">This is the Console Debugger screen.</p>
				{/* Add your Redux-related components or logic here */}
			</div>
		</div>
	);
};

export default ConsoleScreen;
