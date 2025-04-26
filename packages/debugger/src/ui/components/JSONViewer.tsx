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

function formatData(data: any): { formattedData: any; error: string | null } {
  try {
    // Handle null or undefined
    if (data === null || data === undefined) {
      return { formattedData: data, error: null };
    }

    // If it's already an object or array, no need to parse
    if (typeof data === 'object') {
      // Handle nested string properties that might be JSON
      if (Array.isArray(data)) {
        return {
          formattedData: data.map(item => {
            if (typeof item === 'string') {
              try {
                return JSON.parse(item);
              } catch {
                return item;
              }
            }
            return item;
          }),
          error: null,
        };
      }

      // Handle object properties that might be JSON strings
      const formatted = Object.entries(data).reduce(
        (acc, [key, value]) => {
          if (typeof value === 'string') {
            try {
              acc[key] = JSON.parse(value);
            } catch {
              acc[key] = value;
            }
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      return { formattedData: formatted, error: null };
    }

    // If it's a string, try to parse it as JSON
    if (typeof data === 'string') {
      try {
        return { formattedData: JSON.parse(data), error: null };
      } catch {
        // If it's not valid JSON, return as is
        return { formattedData: data, error: null };
      }
    }

    // For all other types (number, boolean, etc.), return as is
    return { formattedData: data, error: null };
  } catch (error) {
    return {
      formattedData: String(data),
      error: error instanceof Error ? error.message : 'Unknown error formatting data',
    };
  }
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
  const { formattedData, error } = formatData(data);

  // If there was an error formatting the data, display it as a string with error indication
  if (error) {
    return (
      <div className="text-red-400 break-all whitespace-pre-wrap">
        {String(data)}
        <div className="text-xs text-red-500 mt-1">Error: {error}</div>
      </div>
    );
  }

  const dataType = getDataType(formattedData);
  const isCollapsible = ['object', 'array'].includes(dataType) && formattedData !== null;
  const indent = level * 16;

  const renderDiffValue = (key: string, value: any, level: number = 0) => {
    if (!showDiff || !compareWith) {
      return renderValue(value, level);
    }

    const { formattedData: formattedOldValue } = formatData(compareWith[key]);
    const { formattedData: formattedNewValue } = formatData(value);
    const hasChanged = JSON.stringify(formattedOldValue) !== JSON.stringify(formattedNewValue);

    if (!hasChanged) {
      return renderValue(formattedNewValue, level);
    }

    if (formattedOldValue === undefined) {
      return <span className="text-green-400">{renderValue(formattedNewValue, level)}</span>;
    }

    if (formattedNewValue === undefined) {
      return <span className="text-red-400">{renderValue(formattedOldValue, level)}</span>;
    }

    return (
      <div className="pl-4">
        <div className="text-red-400">- {renderValue(formattedOldValue, level)}</div>
        <div className="text-green-400">+ {renderValue(formattedNewValue, level)}</div>
      </div>
    );
  };

  const renderValue = (value: any, level: number = 0): React.ReactNode => {
    const { formattedData: formatted } = formatData(value);

    if (formatted === null) return <span className="text-gray-500">null</span>;
    if (formatted === undefined) return <span className="text-gray-500">undefined</span>;

    switch (typeof formatted) {
      case 'string':
        if (formatted.length > 60 || formatted.startsWith('http')) {
          return (
            <span className="text-green-400 break-all whitespace-pre-wrap inline-block max-w-full">
              "{formatted}"
            </span>
          );
        }
        return <span className="text-green-400">"{formatted}"</span>;
      case 'number':
        return <span className="text-yellow-400">{formatted}</span>;
      case 'boolean':
        return <span className="text-purple-400">{formatted.toString()}</span>;
      case 'object':
        if (Array.isArray(formatted)) {
          return (
            <div style={{ marginLeft: level * 20 }} className="whitespace-pre-wrap break-all">
              [
              {formatted.map((item, index) => (
                <div key={index} style={{ marginLeft: 20 }}>
                  {renderValue(item, level + 1)}
                  {index < formatted.length - 1 && ','}
                </div>
              ))}
              ]
            </div>
          );
        }
        return (
          <div style={{ marginLeft: level * 20 }} className="whitespace-pre-wrap break-all">
            {'{'}
            {Object.entries(formatted).map(([key, val], index, arr) => (
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
        return <span>{String(formatted)}</span>;
    }
  };

  if (!isCollapsible) {
    const formattedValue = dataType === 'string' ? `"${formattedData}"` : String(formattedData);
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

  const entries = Object.entries(formattedData);
  const isArray = Array.isArray(formattedData);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return (
      <div className="inline-flex items-center">
        <span className="text-zinc-400">{isArray ? '[]' : '{}'}</span>
        {!isLast && <span className="text-zinc-400">,</span>}
      </div>
    );
  }

  const renderCollapsed = () => {
    const preview = isArray
      ? `[${entries
          .slice(0, 2)
          .map(([_, v]) => {
            const type = getDataType(v);
            if (type === 'string')
              return `"${String(v).slice(0, 15)}${String(v).length > 15 ? '...' : ''}"`;
            if (type === 'object' && v !== null) return Array.isArray(v) ? '[...]' : '{...}';
            return String(v);
          })
          .join(', ')}${entries.length > 2 ? ', ...' : ''}]`
      : `{${entries
          .slice(0, 2)
          .map(([k, v]) => {
            const type = getDataType(v);
            let preview = '';
            if (type === 'string')
              preview = `"${String(v).slice(0, 15)}${String(v).length > 15 ? '...' : ''}"`;
            else if (type === 'object' && v !== null)
              preview = Array.isArray(v) ? '[...]' : '{...}';
            else preview = String(v);
            return `"${k}": ${preview}`;
          })
          .join(', ')}${entries.length > 2 ? ', ...' : ''}}`;

    return (
      <div className="inline-flex items-center">
        <span className="text-zinc-600">{preview}</span>
        {!isLast && <span className="text-zinc-400">,</span>}
      </div>
    );
  };

  return (
    <div className="whitespace-pre break-words p-4">
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
