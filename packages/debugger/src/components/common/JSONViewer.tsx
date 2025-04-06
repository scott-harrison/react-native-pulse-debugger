import React from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface JSONViewerProps {
  data: any;
  level?: number;
  initialExpanded?: boolean;
  objectKey?: string;
  isLast?: boolean;
  className?: string;
  compareWith?: any;
  showDiff?: boolean;
}

function getDataType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getObjectSize(obj: any): number {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.keys(obj).length;
}

export function JSONViewer({
  data,
  level = 0,
  initialExpanded = true,
  objectKey,
  isLast,
  className,
  compareWith,
  showDiff = false,
}: JSONViewerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const dataType = getDataType(data);
  const isCollapsible = ['object', 'array'].includes(dataType) && data !== null;
  const indent = level * 16;

  const renderDiffValue = (key: string, value: any, level: number = 0) => {
    if (!showDiff || !compareWith) {
      return renderValue(value, level);
    }

    const oldValue = compareWith[key];
    const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(value);

    if (!hasChanged) {
      return renderValue(value, level);
    }

    if (oldValue === undefined) {
      return <span className="text-green-400">{renderValue(value, level)}</span>;
    }

    if (value === undefined) {
      return <span className="text-red-400">{renderValue(oldValue, level)}</span>;
    }

    return (
      <div className="pl-4">
        <div className="text-red-400">- {renderValue(oldValue, level)}</div>
        <div className="text-green-400">+ {renderValue(value, level)}</div>
      </div>
    );
  };

  const renderValue = (value: any, level: number = 0): React.ReactNode => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;

    switch (typeof value) {
      case 'string':
        if (value.length > 60 || value.startsWith('http')) {
          return (
            <span className="text-green-400 break-all whitespace-pre-wrap inline-block max-w-full">
              "{value}"
            </span>
          );
        }
        return <span className="text-green-400">"{value}"</span>;
      case 'number':
        return <span className="text-yellow-400">{value}</span>;
      case 'boolean':
        return <span className="text-purple-400">{value.toString()}</span>;
      case 'object':
        if (Array.isArray(value)) {
          return (
            <div style={{ marginLeft: level * 20 }} className="whitespace-pre-wrap break-all">
              [
              {value.map((item, index) => (
                <div key={index} style={{ marginLeft: 20 }}>
                  {renderValue(item, level + 1)}
                  {index < value.length - 1 && ','}
                </div>
              ))}
              ]
            </div>
          );
        }
        return (
          <div style={{ marginLeft: level * 20 }} className="whitespace-pre-wrap break-all">
            {'{'}
            {Object.entries(value).map(([key, val], index, arr) => (
              <div key={key} style={{ marginLeft: 20 }}>
                <span className="text-blue-400">"{key}"</span>:{' '}
                {renderDiffValue(key, val, level + 1)}
                {index < arr.length - 1 && ','}
              </div>
            ))}
            {'}'}
          </div>
        );
      default:
        return <span>{String(value)}</span>;
    }
  };

  if (!isCollapsible) {
    const formattedValue = dataType === 'string' ? `"${data}"` : String(data);
    return (
      <span
        className={cn(
          'break-all whitespace-pre-wrap inline-block max-w-full',
          {
            'text-yellow-400': dataType === 'string',
            'text-blue-400': dataType === 'number',
            'text-purple-400': dataType === 'boolean',
            'text-gray-400': dataType === 'null',
          },
          className
        )}
      >
        {formattedValue}
        {!isLast && <span className="text-zinc-400">,</span>}
      </span>
    );
  }

  const entries = Object.entries(data);
  const isArray = Array.isArray(data);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <div className="inline-flex items-center">
        <span className="text-zinc-400">{isArray ? '[]' : '{}'}</span>
        {!isLast && <span className="text-zinc-400">,</span>}
      </div>
    );
  }

  const renderCollapsed = () => (
    <div className="inline-flex items-center">
      <span className="text-zinc-600">{`${entries.length} ${isArray ? 'items' : 'keys'}...`}</span>
      <span className="text-zinc-400">{isArray ? ']' : '}'}</span>
      {!isLast && <span className="text-zinc-400">,</span>}
    </div>
  );

  return (
    <div className="whitespace-pre break-words">
      <div style={{ paddingLeft: level ? indent : 0 }} className="flex items-baseline gap-1">
        {objectKey ? (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:text-zinc-100 text-zinc-500 select-none w-3 text-left"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className="text-zinc-400 break-all">{`"${objectKey}"`}</span>
            <span className="text-zinc-400">:</span>
            <span className="ml-1" />
            <span className="text-zinc-400">{isArray ? '[' : '{'}</span>
            {!isExpanded && renderCollapsed()}
          </>
        ) : (
          <>
            <span className="text-zinc-400">{isArray ? '[' : '{'}</span>
            {!isExpanded && renderCollapsed()}
          </>
        )}
      </div>

      {isExpanded && (
        <>
          {entries.map(([key, value], index) => {
            const isLastItem = index === entries.length - 1;
            const childDataType = getDataType(value);
            const isChildCollapsible =
              ['object', 'array'].includes(childDataType) && value !== null;

            return (
              <div
                key={key}
                style={{ paddingLeft: indent + 16 }}
                className="flex items-baseline gap-1 break-all"
              >
                {isChildCollapsible ? (
                  <JSONViewer
                    data={value}
                    level={level + 1}
                    initialExpanded={level < 1}
                    objectKey={isArray ? undefined : key}
                    isLast={isLastItem}
                    className={className}
                    compareWith={compareWith}
                    showDiff={showDiff}
                  />
                ) : (
                  <>
                    <span className="w-3" />
                    {!isArray && (
                      <>
                        <span className="text-zinc-400 break-all">{`"${key}"`}</span>
                        <span className="text-zinc-400">:</span>
                        <span className="ml-1" />
                      </>
                    )}
                    <JSONViewer
                      data={value}
                      level={level + 1}
                      initialExpanded={level < 1}
                      isLast={isLastItem}
                      className={className}
                      compareWith={compareWith}
                      showDiff={showDiff}
                    />
                  </>
                )}
              </div>
            );
          })}
          <div style={{ paddingLeft: indent }}>
            <span className="text-zinc-400">{isArray ? ']' : '}'}</span>
            {!isLast && <span className="text-zinc-400">,</span>}
          </div>
        </>
      )}
    </div>
  );
}
