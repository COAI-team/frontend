import React from 'react';

/**
 * 전체화면 유지 가능한 커스텀 Confirm 모달
 * window.confirm() 대체용
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center">
      <div className="bg-zinc-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-zinc-700">
        <h3 className="text-lg font-bold text-white mb-2">{title || '확인'}</h3>
        <p className="text-gray-300 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
