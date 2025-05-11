export type JSONValue =
	| null
	| string
	| number
	| boolean
	| { [key: string]: JSONValue }
	| JSONValue[]
	| undefined
	| {};

export interface JSONViewerProps {
	data: JSONValue;
	compareData?: JSONValue;
}

export interface Diff {
	added: Record<string, JSONValue>;
	removed: Record<string, JSONValue>;
	changed: Record<string, { old: JSONValue; new: JSONValue }>;
}

export type CollapsedState = Record<string, boolean>;
