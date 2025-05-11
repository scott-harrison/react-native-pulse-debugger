import React, { JSX, useState } from 'react';
import { JSONViewerProps, Diff, CollapsedState, JSONValue } from './JSONViewer.types';

const JSONViewer: React.FC<JSONViewerProps> = ({ data, compareData }) => {
	const [collapsed, setCollapsed] = useState<CollapsedState>({});

	const toggleCollapse = (path: string): void => {
		setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
	};

	const getDiff = (
		obj1: Record<string, JSONValue>,
		obj2: Record<string, JSONValue>,
		path: string = ''
	): Diff => {
		const diff: Diff = { added: {}, removed: {}, changed: {} };
		const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

		allKeys.forEach(key => {
			const newPath = path ? `${path}.${key}` : key;
			if (!(key in obj1)) {
				diff.added[newPath] = obj2[key];
			} else if (!(key in obj2)) {
				diff.removed[newPath] = obj1[key];
			} else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
				const val1 = obj1[key];
				const val2 = obj2[key];
				if (
					val1 &&
					val2 &&
					typeof val1 === 'object' &&
					typeof val2 === 'object' &&
					!Array.isArray(val1) &&
					!Array.isArray(val2)
				) {
					const nestedDiff = getDiff(
						val1 as Record<string, JSONValue>,
						val2 as Record<string, JSONValue>,
						newPath
					);
					Object.assign(diff.added, nestedDiff.added);
					Object.assign(diff.removed, nestedDiff.removed);
					Object.assign(diff.changed, nestedDiff.changed);
				} else {
					diff.changed[newPath] = { old: val1, new: val2 };
				}
			}
		});

		return diff;
	};

	const diff = compareData
		? getDiff(data as Record<string, JSONValue>, compareData as Record<string, JSONValue>)
		: null;

	const renderPrimitive = (value: JSONValue): JSX.Element => {
		let displayValue: string;
		if (typeof value === 'string') {
			displayValue = `"${value}"`;
		} else if (value === null) {
			displayValue = 'null';
		} else {
			displayValue = String(value);
		}
		return <span className="text-white whitespace-pre-wrap break-words">{displayValue}</span>;
	};

	const renderKeyValue = (
		key: string,
		value: JSONValue,
		path: string,
		indent: number,
		isArrayIndex: boolean = false,
		isDiff: boolean = false,
		diffType: string = ''
	): JSX.Element => {
		const isObject = value && typeof value === 'object' && !Array.isArray(value);
		const isArray = Array.isArray(value);
		const isCollapsed = collapsed[path];
		const bgColor = isDiff
			? diffType === 'added'
				? 'bg-green-800'
				: diffType === 'removed'
					? 'bg-red-800'
					: ''
			: '';
		const prefix = isDiff
			? diffType === 'added'
				? '+'
				: diffType === 'removed'
					? '-'
					: ' '
			: '  ';
		const keyPath = isArrayIndex ? key : `"${key}"`;
		const brackets = isArray ? ['[', ']'] : ['{', '}'];

		return (
			<div className={`flex flex-col items-start py-0.5 ml-${indent * 4} ${bgColor}`}>
				<div className="flex items-start">
					<span className="text-center text-gray-400">{prefix}</span>
					<span
						className="text-gray-400 cursor-pointer mr-2 inline-block"
						onClick={() => toggleCollapse(path)}
					>
						{(isObject || isArray) && value && Object.keys(value).length > 0
							? isCollapsed
								? '▶'
								: '▼'
							: '  '}
					</span>
					<span className="text-purple-300 whitespace-nowrap">{keyPath}</span>
					<span className="text-gray-400 mx-1">: </span>
					{(isObject || isArray) && <span className="text-gray-400">{brackets[0]}</span>}
					{!(isObject || isArray) && renderPrimitive(value)}
				</div>
				{(isObject || isArray) && !isCollapsed && value && Object.keys(value).length > 0 && (
					<>
						<div className="px-4">
							{isArray
								? renderArray(value as JSONValue[], path, indent + 1, isDiff, diffType)
								: renderObject(
										value as Record<string, JSONValue>,
										path,
										indent + 1,
										isDiff,
										diffType
									)}
						</div>
						<div>
							<span className="text-center text-gray-400">{prefix}</span>
							<span className="text-gray-400 inline-block" />
							<span className="text-gray-400">{brackets[1]}</span>
						</div>
					</>
				)}
			</div>
		);
	};

	const renderObject = (
		value: Record<string, JSONValue>,
		path: string,
		indent: number,
		isDiff: boolean = false,
		diffType: string = ''
	): JSX.Element[] => {
		return Object.entries(value).map(([k, v], i) => (
			<React.Fragment key={`${path}.${k}-${i}`}>
				{renderKeyValue(k, v, `${path}.${k}`, indent, false, isDiff, diffType)}
			</React.Fragment>
		));
	};

	const renderArray = (
		value: JSONValue[],
		path: string,
		indent: number,
		isDiff: boolean = false,
		diffType: string = ''
	): JSX.Element[] => {
		return value.map((v, i) => (
			<React.Fragment key={`${path}.${i}`}>
				{renderKeyValue(String(i), v, `${path}.${i}`, indent, true, isDiff, diffType)}
			</React.Fragment>
		));
	};

	const renderValue = (
		value: JSONValue,
		path: string,
		indent: number = 0,
		isDiff: boolean = false,
		diffType: string = ''
	): JSX.Element => {
		if (Array.isArray(value)) {
			return renderArray(value, path, indent, isDiff, diffType).length > 0 ? (
				<>{renderArray(value, path, indent, isDiff, diffType)}</>
			) : (
				<span className="text-gray-400">[]</span>
			);
		} else if (value && typeof value === 'object') {
			return renderObject(value as Record<string, JSONValue>, path, indent, isDiff, diffType)
				.length > 0 ? (
				<>{renderObject(value as Record<string, JSONValue>, path, indent, isDiff, diffType)}</>
			) : (
				<span className="text-gray-400">{}</span>
			);
		} else {
			return renderPrimitive(value);
		}
	};

	const renderDiffLine = (
		key: string,
		value: JSONValue,
		type: 'added' | 'removed' | 'changed' | 'unchanged',
		path: string,
		indentLevel: number = 0
	): JSX.Element[] => {
		const isObjectOrArray = value && typeof value === 'object';
		const indentClass = `ml-${indentLevel * 8}`;
		const isCollapsed = collapsed[path];
		const prefix = type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
		const bgColor = type === 'added' ? 'bg-green-800' : type === 'removed' ? 'bg-red-800' : '';

		if (isObjectOrArray) {
			const lines: JSX.Element[] = [];
			const isEmpty = Object.keys(value).length === 0;
			const brackets = Array.isArray(value) ? ['[', ']'] : ['{', '}'];

			lines.push(
				<div
					key={`${path}-open-${type}`}
					className={`flex items-start ${bgColor} py-0.5 ${indentClass}`}
				>
					<span className="text-center text-gray-400">{prefix}</span>
					<span
						className="text-gray-400 cursor-pointer mr-2 inline-block"
						onClick={() => toggleCollapse(path)}
					>
						{isEmpty ? '  ' : isCollapsed ? '▶' : '▼'}
					</span>
					<span className="text-purple-300">{Array.isArray(value) ? key : `"${key}"`}</span>
					<span className="text-gray-400">: </span>
					<span className="text-gray-400 pl-2">{brackets[0]}</span>
				</div>
			);

			if (!isCollapsed && !isEmpty && diff) {
				Object.entries(value).forEach(([k, v]) => {
					const newPath = `${path}.${k}`;
					const childType =
						type === 'unchanged'
							? newPath in diff.added
								? 'added'
								: newPath in diff.removed
									? 'removed'
									: newPath in diff.changed
										? 'changed'
										: 'unchanged'
							: type;
					let childValue: JSONValue = v;

					if (childType === 'changed') {
						if (type === 'added' || type === 'unchanged') {
							childValue = diff.changed[newPath].new;
						} else if (type === 'removed') {
							childValue = diff.changed[newPath].old;
						}
					} else if (childType === 'added') {
						childValue = diff.added[newPath];
					} else if (childType === 'removed') {
						childValue = diff.removed[newPath];
					}

					if (childType === 'changed') {
						lines.push(
							...renderDiffLine(k, diff.changed[newPath].old, 'removed', newPath, indentLevel + 1)
						);
						lines.push(
							...renderDiffLine(k, diff.changed[newPath].new, 'added', newPath, indentLevel + 1)
						);
					} else {
						lines.push(...renderDiffLine(k, childValue, childType, newPath, indentLevel + 1));
					}
				});
				lines.push(
					<div
						key={`${path}-close-${type}`}
						className={`flex items-start ${bgColor} py-0.5 ${indentClass}`}
					>
						<span className="text-center text-gray-400">{prefix}</span>
						<span className="text-gray-400 inline-block" />
						<span className="text-gray-400">{brackets[1]}</span>
					</div>
				);
			} else if (isEmpty) {
				lines.push(
					<div
						key={`${path}-close-${type}`}
						className={`flex items-start ${bgColor} py-0.5 ${indentClass}`}
					>
						<span className="text-center text-gray-400">{prefix}</span>
						<span className="text-gray-400 inline-block" />
						<span className="text-gray-400">{brackets[1]}</span>
					</div>
				);
			}

			return lines;
		}

		return [
			<div
				key={`${path}-${type}`}
				className={`flex items-start ${bgColor} py-0.5 ${indentClass} px-4`}
			>
				<span className="text-center text-gray-400">{prefix}</span>
				<span className="text-purple-300">{Array.isArray(value) ? key : `"${key}"`}</span>
				<span className="text-gray-400 mx-1">: </span>
				{renderPrimitive(value)}
			</div>,
		];
	};

	const renderDiff = (): JSX.Element => {
		if (
			!diff ||
			(Object.keys(diff.added).length === 0 &&
				Object.keys(diff.removed).length === 0 &&
				Object.keys(diff.changed).length === 0)
		) {
			return (
				<div className="p-2 rounded">
					<div className="text-gray-400 mb-2">No differences found</div>
					<div>
						<span className="text-gray-400">{Array.isArray(data) ? '[' : '{'}</span>
						<div className="ml-4">{renderValue(data, 'no-diff', 1)}</div>
						<span className="text-gray-400">{Array.isArray(data) ? ']' : '}'}</span>
					</div>
				</div>
			);
		}

		const lines: JSX.Element[] = [];
		const allKeys = new Set([...Object.keys(data || {}), ...Object.keys(compareData || {})]);
		const mergedObject: {
			[key: string]: { value?: JSONValue; old?: JSONValue; new?: JSONValue; type: string };
		} = {};

		allKeys.forEach(key => {
			const path = key;
			if (path in diff.added) {
				mergedObject[key] = { value: diff.added[path], type: 'added' };
			} else if (path in diff.removed) {
				mergedObject[key] = { value: diff.removed[path], type: 'removed' };
			} else if (path in diff.changed) {
				mergedObject[key] = {
					old: diff.changed[path].old,
					new: diff.changed[path].new,
					type: 'changed',
				};
			} else {
				mergedObject[key] = {
					value:
						(data as Record<string, JSONValue>)[key] ||
						(compareData as Record<string, JSONValue>)[key],
					type: 'unchanged',
				};
			}
		});

		Object.entries(mergedObject).forEach(([key, entry]) => {
			if (entry.type === 'changed') {
				lines.push(...renderDiffLine(key, entry.old as JSONValue, 'removed', key));
				lines.push(...renderDiffLine(key, entry.new as JSONValue, 'added', key));
			} else {
				lines.push(
					...renderDiffLine(
						key,
						entry.value as JSONValue,
						entry.type as 'added' | 'removed' | 'unchanged',
						key
					)
				);
			}
		});

		return <div className="bg-gray-950 p-2 rounded overflow-x-auto">{lines}</div>;
	};

	const isDataArray = Array.isArray(data);
	const topLevelBrackets = isDataArray ? ['[', ']'] : ['{', '}'];

	return (
		<div className="p-4 bg-gray-950 rounded overflow-x-auto">
			{compareData ? (
				<div>{renderDiff()}</div>
			) : (
				<div>
					<span className="text-gray-400">{topLevelBrackets[0]}</span>
					<div className="ml-4">{renderValue(data, 'root', 1)}</div>
					<span className="text-gray-400">{topLevelBrackets[1]}</span>
				</div>
			)}
		</div>
	);
};

export default JSONViewer;
