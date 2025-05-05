import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
	visible: boolean;
	onClose: () => void;
	title?: string;
	children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ visible, onClose, title, children }) => {
	if (!visible) return null;

	return (
		<div className="fixed inset-0 bg-black/50 bg-opacity-50 flex justify-center items-center z-50">
			<div className="bg-gray-800 rounded-lg w-[520px] p-6 shadow-lg">
				<div className="flex justify-between items-center mb-4">
					{title && <h2 className="text-lg font-bold text-left">{title}</h2>}
					<button className="text-white hover:text-gray-300 ml-auto" onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<div className="mb-4">{children}</div>
			</div>
		</div>
	);
};

export default Modal;
