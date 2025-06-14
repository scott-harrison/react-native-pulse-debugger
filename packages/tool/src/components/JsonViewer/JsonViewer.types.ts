import { JSONValue } from '@react-native-pulse-debugger/types';

export interface JSONViewerProps {
    data: JSONValue;
    allowCopy?: boolean;
    defaultExpanded?: boolean;
}
