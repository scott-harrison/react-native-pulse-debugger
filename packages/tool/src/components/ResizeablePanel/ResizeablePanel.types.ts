import { ReactNode } from 'react';

export interface ResizablePanelProps {
    leftPanel: ReactNode;
    rightPanel: ReactNode;
    defaultLeftPanelWidth?: number;
    minLeftPanelWidth?: number;
    maxLeftPanelWidth?: number;
    className?: string;
    ref?: React.RefObject<HTMLDivElement | null>;
}
