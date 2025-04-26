import React, { useState } from 'react';
import type { ReduxState } from '@/store/reduxStore';
import { JSONViewer } from './JSONViewer';

type ViewMode = 'diff' | 'before' | 'after';

interface StateDiffProps {
  before: ReduxState;
  after: ReduxState;
}

interface DiffEntry {
  type: 'added' | 'removed' | 'modified';
  path: string[];
  before?: any;
  after?: any;
}

export const StateDiff: React.FC<StateDiffProps> = ({ before, after }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('diff');

  const tabs: { id: ViewMode; label: string }[] = [
    { id: 'diff', label: 'Diff View' },
    { id: 'before', label: 'Before State' },
    { id: 'after', label: 'After State' },
  ];

  const findDifferences = (obj1: any, obj2: any, path: string[] = []): DiffEntry[] => {
    const differences: DiffEntry[] = [];
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    allKeys.forEach(key => {
      const currentPath = [...path, key];
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      // Handle undefined values
      if (val1 === undefined && val2 !== undefined) {
        differences.push({
          type: 'added',
          path: currentPath,
          after: val2,
        });
        return;
      }

      if (val1 !== undefined && val2 === undefined) {
        differences.push({
          type: 'removed',
          path: currentPath,
          before: val1,
        });
        return;
      }

      // Handle value differences
      if (val1 !== val2) {
        if (
          typeof val1 === 'object' &&
          typeof val2 === 'object' &&
          val1 !== null &&
          val2 !== null
        ) {
          differences.push(...findDifferences(val1, val2, currentPath));
        } else {
          differences.push({
            type: 'modified',
            path: currentPath,
            before: val1,
            after: val2,
          });
        }
      }
    });

    return differences;
  };

  const formatValue = (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderDiffView = () => {
    const differences = findDifferences(before, after);

    if (differences.length === 0) {
      return <div className="text-zinc-500 italic p-2">No changes detected in the state.</div>;
    }

    return (
      <div className="font-mono text-sm whitespace-pre">
        {differences.map((diff, index) => {
          const pathStr = diff.path.join('.');

          return (
            <div key={index} className="mb-2">
              <div className="text-zinc-400 mb-1">{pathStr}</div>
              {diff.type === 'removed' && (
                <div className="pl-4 text-red-400">- {formatValue(diff.before)}</div>
              )}
              {diff.type === 'added' && (
                <div className="pl-4 text-green-400">+ {formatValue(diff.after)}</div>
              )}
              {diff.type === 'modified' && (
                <>
                  <div className="pl-4 text-red-400">- {formatValue(diff.before)}</div>
                  <div className="pl-4 text-green-400">+ {formatValue(diff.after)}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'before':
        return (
          <div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800">
            <JSONViewer data={before} initialExpanded={true} />
          </div>
        );
      case 'after':
        return (
          <div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800">
            <JSONViewer data={after} initialExpanded={true} />
          </div>
        );
      case 'diff':
      default:
        return (
          <div className="bg-zinc-900/50 rounded-md overflow-hidden border border-zinc-800 p-4">
            {renderDiffView()}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === tab.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
};

export default StateDiff;
