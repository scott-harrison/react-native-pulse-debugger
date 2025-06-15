import React from 'react';
import ResizablePanel from '@/components/ResizeablePanel';

const ReduxScreen: React.FC = () => {
    return (
        <div className="flex flex-1 h-full overflow-y-auto bg-gray-900/80">
            <div className="flex flex-col flex-1">
                <div className="p-4 border-b h-15 border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-100">Redux</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Redux state and actions</p>
                    </div>
                </div>

                <ResizablePanel
                    leftPanel={
                        <div className="h-full bg-gray-900/50 p-4">
                            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Actions</h3>
                            {/* Actions list will go here */}
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-400">No actions recorded yet</p>
                            </div>
                        </div>
                    }
                    rightPanel={
                        <div className="h-full bg-gray-900/30 p-4">
                            <h3 className="text-sm font-semibold text-zinc-100 mb-4">State</h3>
                            {/* State details will go here */}
                            <div className="space-y-2">
                                <p className="text-xs text-zinc-400">
                                    Select an action to view state changes
                                </p>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default ReduxScreen;
