import React from 'react';

const LoginRequiredModal = ({ open, onClose, onConfirm, message }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">로그인이 필요합니다</h3>
        </div>
        <div className="px-5 py-4 text-sm text-gray-300 whitespace-pre-line">
          {message || '이 기능을 사용하려면 로그인 후 다시 시도해 주세요.'}
        </div>
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded bg-zinc-800 text-gray-200 hover:bg-zinc-700 text-sm"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm"
          >
            로그인하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
