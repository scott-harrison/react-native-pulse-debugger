import { use, useRef, useState, useEffect } from 'react';
import { cn } from '@/utils/styling';
import { ResizablePanelProps } from './ResizeablePanel.types';

const ResizablePanel: React.FC<ResizablePanelProps> = ({
    leftPanel,
    rightPanel,
    defaultLeftPanelWidth = 400,
    minLeftPanelWidth = 200,
    maxLeftPanelWidth = 800,
    className,
    ref: externalRef,
}) => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(defaultLeftPanelWidth);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartWidth, setDragStartWidth] = useState(defaultLeftPanelWidth);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        const currentWidth =
            containerRef.current?.querySelector('div')?.offsetWidth || defaultLeftPanelWidth;
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartWidth(currentWidth);
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartX;
            const newWidth = Math.max(
                minLeftPanelWidth,
                Math.min(maxLeftPanelWidth, dragStartWidth + deltaX)
            );
            setLeftPanelWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartX, dragStartWidth, minLeftPanelWidth, maxLeftPanelWidth]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (!entry) return;

            // Convert absolute width to percentage to maintain proportions
            const containerWidth = entry.contentRect.width;
            const currentWidthPercentage = (leftPanelWidth / containerWidth) * 100;

            const newWidth = Math.max(
                minLeftPanelWidth,
                Math.min(maxLeftPanelWidth, (currentWidthPercentage / 100) * containerWidth)
            );

            setLeftPanelWidth(newWidth);
        });

        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, [leftPanelWidth, minLeftPanelWidth, maxLeftPanelWidth]);

    // If no panels are provided, return null
    if (!leftPanel && !rightPanel) {
        return null;
    }

    // If only one panel is provided, render it at full width
    if (!leftPanel || !rightPanel) {
        return (
            <div
                ref={el => {
                    if (!el) return;
                    containerRef.current = el;
                    if (externalRef && 'current' in externalRef) {
                        externalRef.current = el;
                    }
                }}
                className={cn('flex flex-1 h-full overflow-y-auto', className)}
            >
                <div className="flex-1 overflow-y-auto">{leftPanel || rightPanel}</div>
            </div>
        );
    }

    // Both panels are present, render with resize functionality
    return (
        <>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            />
            <div
                ref={el => {
                    if (!el) return;
                    containerRef.current = el;
                    if (externalRef && 'current' in externalRef) {
                        externalRef.current = el;
                    }
                    return () => {
                        containerRef.current = null;
                        if (externalRef && 'current' in externalRef) {
                            externalRef.current = null;
                        }
                    };
                }}
                className={cn('flex flex-1 h-full overflow-y-auto', className)}
            >
                <div
                    className="flex flex-col"
                    style={{
                        width: leftPanelWidth,
                        flexShrink: 0,
                    }}
                >
                    {leftPanel}
                </div>

                <div
                    className={cn(
                        'relative cursor-col-resize transition-all duration-200 group',
                        isDragging ? 'bg-purple-900' : 'hover:bg-purple-900'
                    )}
                    style={{
                        width: '5px',
                        margin: '0 -5px',
                        transition: 'all 0.2s ease-in-out',
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <div
                        className={cn(
                            'absolute left-1/2 h-full w-[1px] border-l',
                            'border-zinc-800'
                        )}
                    />
                </div>

                <div className="flex-1 overflow-y-auto">{rightPanel}</div>
            </div>
        </>
    );
};

export default ResizablePanel;
