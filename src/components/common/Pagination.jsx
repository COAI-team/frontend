import { useState, useEffect } from "react";

export default function Pagination({ page, totalPages, onPageChange }) {
  const [input, setInput] = useState("");

  useEffect(() => {
    setInput("");
  }, [page, totalPages]);

  const handleJump = () => {
    const val = Number(input);
    if (!Number.isInteger(val)) return;
    if (val < 1 || val > totalPages) return;
    onPageChange(val);
    setInput("");
  };

  const windowSize = 5;
  const windowStart = Math.floor((page - 1) / windowSize) * windowSize + 1;
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);

  const pages = [];
  for (let p = windowStart; p <= windowEnd; p += 1) {
    pages.push(p);
  }

  return (
    <div className="flex flex-wrap items-center justify-between mt-4 text-sm text-sub gap-3 pagination-wrap">
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 border rounded-md disabled:opacity-50 pagination-btn"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          이전
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              className={`px-3 py-1 rounded-md border pagination-btn ${p === page ? "active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          className="px-2 py-1 border rounded-md disabled:opacity-50 pagination-btn"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          다음
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span>페이지 이동</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-16 border rounded-md px-2 py-1 bg-transparent pagination-input"
        />
        <button className="px-3 py-1 border rounded-md pagination-btn" onClick={handleJump}>
          이동
        </button>
        <span className="text-sub">/ {totalPages}</span>
      </div>
    </div>
  );
}
