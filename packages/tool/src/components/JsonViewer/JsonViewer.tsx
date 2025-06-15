import React, { useState } from 'react';
import { cva } from 'class-variance-authority';
import { ClipboardIcon } from 'lucide-react';
import { JSONValue } from '@react-native-pulse-debugger/types';
import { JSONViewerProps } from './JsonViewer.types';

const jsonStyles = cva('font-mono text-sm', {
    variants: {
        type: {
            key: 'text-indigo-600 dark:text-indigo-400',
            string: 'text-emerald-600 dark:text-emerald-400',
            number: 'text-fuchsia-600 dark:text-fuchsia-400',
            boolean: 'text-amber-600 dark:text-amber-400',
            null: 'text-slate-600 dark:text-slate-400',
            bracket: 'text-slate-800 dark:text-slate-200',
            meta: 'text-slate-500 dark:text-slate-400',
        },
    },
});

const JSONViewer: React.FC<JSONViewerProps> = ({
    data,
    allowCopy = true,
    defaultExpanded = true,
}) => {
    const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());

    // Toggle node expansion
    const toggleNode = (path: string): void => {
        setExpanded(prev => {
            const newMap = new Map(prev);
            newMap.set(path, !prev.get(path));
            return newMap;
        });
    };

    // Initialize expansion state
    const isExpanded = (path: string): boolean => {
        if (!expanded.has(path)) {
            expanded.set(path, defaultExpanded);
        }
        return expanded.get(path) ?? defaultExpanded;
    };

    // Copy JSON to clipboard
    const copyToClipboard = (): void => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert('JSON copied to clipboard!');
    };

    // Render JSON node
    const renderNode = (
        node: JSONValue,
        path: string = '',
        depth: number = 0,
        key?: string | number
    ): React.ReactNode | null => {
        const renderKey = () => {
            if (key === undefined) return null;
            return (
                <>
                    <span className={jsonStyles({ type: 'key' })}>{key}</span>
                    <span>:</span>
                </>
            );
        };

        if (node === null) {
            return (
                <div className="flex items-center gap-1">
                    {renderKey()}
                    <span className={jsonStyles({ type: 'null' })}>null</span>
                </div>
            );
        }

        if (typeof node === 'string') {
            return (
                <div className="flex items-center gap-1">
                    {renderKey()}
                    <span className={jsonStyles({ type: 'string' })}>{node}</span>
                </div>
            );
        }

        if (typeof node === 'number') {
            return (
                <div className="flex items-center gap-1">
                    {renderKey()}
                    <span className={jsonStyles({ type: 'number' })}>{node}</span>
                </div>
            );
        }

        if (typeof node === 'boolean') {
            return (
                <div className="flex items-center gap-1">
                    {renderKey()}
                    <span className={jsonStyles({ type: 'boolean' })}>{node.toString()}</span>
                </div>
            );
        }

        if (Array.isArray(node)) {
            const pathKey = `${path}.array`;
            const isNodeExpanded = isExpanded(pathKey);
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span
                            className={jsonStyles({ type: 'bracket' }) + ' cursor-pointer w-4'}
                            onClick={() => toggleNode(pathKey)}
                        >
                            {isNodeExpanded ? '▼' : '▶'}
                        </span>
                        {key !== undefined && (
                            <>
                                <span className={jsonStyles({ type: 'key' })}>{key}</span>
                                <span>:</span>
                            </>
                        )}
                        <span className={jsonStyles({ type: 'bracket' })}>[ </span>
                        <span className={jsonStyles({ type: 'meta' })}>{node.length} items</span>
                    </div>
                    {isNodeExpanded && (
                        <div className="ml-4">
                            {node.map((item, index) => (
                                <div key={index}>
                                    {renderNode(item, `${path}.${index}`, depth + 1, index)}
                                </div>
                            ))}
                        </div>
                    )}
                    {isNodeExpanded && <div className="ml-0">]</div>}
                </div>
            );
        }

        if (typeof node === 'object') {
            const pathKey = `${path}.object`;
            const isNodeExpanded = isExpanded(pathKey);
            const entries = Object.entries(node);
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                        <span
                            className={jsonStyles({ type: 'bracket' }) + ' cursor-pointer w-4'}
                            onClick={() => toggleNode(pathKey)}
                        >
                            {isNodeExpanded ? '▼' : '▶'}
                        </span>
                        {key !== undefined && (
                            <>
                                <span className={jsonStyles({ type: 'key' })}>{key}</span>
                                <span>:</span>
                            </>
                        )}
                        <span className={jsonStyles({ type: 'bracket' })}>{'{'}</span>
                    </div>
                    {isNodeExpanded && (
                        <div className="ml-4">
                            {entries.map(([entryKey, value], index) => (
                                <div key={entryKey}>
                                    {renderNode(value, `${path}.${entryKey}`, depth + 1, entryKey)}
                                </div>
                            ))}
                        </div>
                    )}
                    {isNodeExpanded && <div className="ml-0">{'}'}</div>}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="relative p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm group">
            {allowCopy && (
                <button
                    className="absolute top-3 right-3 p-2 text-slate-600 dark:text-slate-400 
                             hover:text-slate-900 dark:hover:text-white rounded-lg 
                             hover:bg-slate-100 dark:hover:bg-slate-800 transition-all
                             opacity-0 group-hover:opacity-100"
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                >
                    <ClipboardIcon className="w-4 h-4" />
                </button>
            )}
            <div className="overflow-auto">
                <pre className="text-sm">{renderNode(data)}</pre>
            </div>
        </div>
    );
};

export default JSONViewer;
