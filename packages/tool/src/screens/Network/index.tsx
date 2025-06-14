import React from 'react';

const NetworkScreen: React.FC = () => {
    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <div className="flex flex-col flex-1">
                <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">Network</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Network requests and responses
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetworkScreen;
