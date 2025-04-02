import { useState } from 'react'
import { cn } from '@/lib/utils'

interface JSONViewerProps {
  data: any
  level?: number
  initialExpanded?: boolean
  objectKey?: string
  isLast?: boolean
}

function getDataType(value: any): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function getObjectSize(obj: any): number {
  if (!obj || typeof obj !== 'object') return 0
  return Object.keys(obj).length
}

export function JSONViewer({ 
  data, 
  level = 0, 
  initialExpanded = true, 
  objectKey,
  isLast 
}: JSONViewerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const dataType = getDataType(data)
  const isCollapsible = ['object', 'array'].includes(dataType) && data !== null
  const indent = level * 16

  if (!isCollapsible) {
    const formattedValue = dataType === 'string' ? `"${data}"` : String(data)
    return (
      <span className={cn(
        "whitespace-nowrap",
        {
          'text-yellow-400': dataType === 'string',
          'text-blue-400': dataType === 'number',
          'text-purple-400': dataType === 'boolean',
          'text-gray-400': dataType === 'null',
        }
      )}>
        {formattedValue}
        {!isLast && <span className="text-zinc-400">,</span>}
      </span>
    )
  }

  const entries = Object.entries(data)
  const isArray = Array.isArray(data)
  const isEmpty = entries.length === 0

  if (isEmpty) {
    return (
      <div className="inline-flex items-center">
        <span className="text-zinc-400">{isArray ? '[]' : '{}'}</span>
        {!isLast && <span className="text-zinc-400">,</span>}
      </div>
    )
  }

  const renderCollapsed = () => (
    <div className="inline-flex items-center">
      <span className="text-zinc-600">
        {`${entries.length} ${isArray ? 'items' : 'keys'}...`}
      </span>
      <span className="text-zinc-400">{isArray ? ']' : '}'}</span>
      {!isLast && <span className="text-zinc-400">,</span>}
    </div>
  )

  return (
    <div className="whitespace-pre leading-6">
      <div
        style={{ paddingLeft: level ? indent : 0 }}
        className="flex items-baseline gap-1"
      >
        {objectKey ? (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:text-zinc-100 text-zinc-500 select-none w-3 text-left"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className="text-zinc-400">{`"${objectKey}"`}</span>
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
            const isLastItem = index === entries.length - 1
            const childDataType = getDataType(value)
            const isChildCollapsible = ['object', 'array'].includes(childDataType) && value !== null

            return (
              <div
                key={key}
                style={{ paddingLeft: indent + 16 }}
                className="flex items-baseline gap-1 leading-6"
              >
                {isChildCollapsible ? (
                  <JSONViewer 
                    data={value} 
                    level={level + 1}
                    initialExpanded={level < 1}
                    objectKey={isArray ? undefined : key}
                    isLast={isLastItem}
                  />
                ) : (
                  <>
                    <span className="w-3" />
                    {!isArray && (
                      <>
                        <span className="text-zinc-400">{`"${key}"`}</span>
                        <span className="text-zinc-400">:</span>
                        <span className="ml-1" />
                      </>
                    )}
                    <JSONViewer 
                      data={value} 
                      level={level + 1}
                      initialExpanded={level < 1}
                      isLast={isLastItem}
                    />
                  </>
                )}
              </div>
            )
          })}
          <div 
            style={{ paddingLeft: indent }}
            className="leading-6"
          >
            <span className="text-zinc-400">{isArray ? ']' : '}'}</span>
            {!isLast && <span className="text-zinc-400">,</span>}
          </div>
        </>
      )}
    </div>
  )
} 