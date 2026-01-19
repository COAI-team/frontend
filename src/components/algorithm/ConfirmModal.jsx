import React from 'react';
import '../../styles/ConfirmModal.css';

/**
 * 전체화면 유지 가능한 커스텀 Confirm 모달
 * window.confirm() 대체용
 * 라이트/다크 모드 지원
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
    <div className="confirm-modal-overlay fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="confirm-modal-container rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="confirm-modal-title text-lg font-bold mb-2">{title || '확인'}</h3>
        <p className="confirm-modal-message mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="confirm-modal-cancel-btn px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="confirm-modal-confirm-btn px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
