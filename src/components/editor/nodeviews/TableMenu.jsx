import React, { useState } from 'react';

// 표 삽입 시 크기를 선택할 수 있는 그리드 선택기
const TableSizeSelector = ({ onSelect, onClose }) => {
  const [hoveredCell, setHoveredCell] = useState({ row: 0, col: 0 });
  const maxRows = 10;
  const maxCols = 10;

  const handleMouseOver = (row, col) => {
    setHoveredCell({ row, col });
  };

  const handleClick = (row, col) => {
    onSelect(row + 1, col + 1);
    onClose();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
        {hoveredCell.row + 1} x {hoveredCell.col + 1}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${maxCols}, 20px)`,
          gap: '2px',
        }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, index) => {
          const row = Math.floor(index / maxCols);
          const col = index % maxCols;
          const isHighlighted = row <= hoveredCell.row && col <= hoveredCell.col;

          return (
            <div
              key={index}
              onMouseOver={() => handleMouseOver(row, col)}
              onClick={() => handleClick(row, col)}
              style={{
                width: '20px',
                height: '20px',
                border: '1px solid #d1d5db',
                backgroundColor: isHighlighted ? '#3b82f6' : 'white',
                cursor: 'pointer',
                transition: 'background-color 0.1s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// 표가 선택되었을 때 나타나는 메뉴
const TableContextMenu = ({ editor }) => {
  if (!editor || !editor.isActive('table')) {
    return null;
  }

  const buttonStyle = {
    padding: '6px 12px',
    fontSize: '13px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const buttonHoverStyle = {
    backgroundColor: '#f3f4f6',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '8px',
      }}
    >
      {/* 행 추가/삭제 */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '8px', borderRight: '1px solid #e5e7eb' }}>
        <button
          onClick={() => editor.chain().focus().addRowBefore().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="위에 행 추가"
        >
          ⬆️ 행
        </button>
        <button
          onClick={() => editor.chain().focus().addRowAfter().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="아래에 행 추가"
        >
          ⬇️ 행
        </button>
        <button
          onClick={() => editor.chain().focus().deleteRow().run()}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="행 삭제"
        >
          ❌ 행
        </button>
      </div>

      {/* 열 추가/삭제 */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '8px', borderRight: '1px solid #e5e7eb' }}>
        <button
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="왼쪽에 열 추가"
        >
          ⬅️ 열
        </button>
        <button
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="오른쪽에 열 추가"
        >
          ➡️ 열
        </button>
        <button
          onClick={() => editor.chain().focus().deleteColumn().run()}
          style={{ ...buttonStyle, color: '#dc2626' }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="열 삭제"
        >
          ❌ 열
        </button>
      </div>

      {/* 셀 병합/분할 */}
      <div style={{ display: 'flex', gap: '2px', paddingRight: '8px', borderRight: '1px solid #e5e7eb' }}>
        <button
          onClick={() => editor.chain().focus().mergeCells().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          disabled={!editor.can().mergeCells()}
          title="셀 병합"
        >
          🔗 병합
        </button>
        <button
          onClick={() => editor.chain().focus().splitCell().run()}
          style={buttonStyle}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          disabled={!editor.can().splitCell()}
          title="셀 분할"
        >
          ✂️ 분할
        </button>
      </div>

      {/* 헤더 행 토글 */}
      <button
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        style={{
          ...buttonStyle,
          backgroundColor: editor.isActive('table', { hasHeaderRow: true }) ? '#dbeafe' : 'transparent',
        }}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = editor.isActive('table', { hasHeaderRow: true })
            ? '#dbeafe'
            : 'transparent';
        }}
        title="헤더 행 토글"
      >
        📋 헤더
      </button>
    </div>
  );
};

// 메인 표 메뉴 컴포넌트
const TableMenu = ({ editor }) => {
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  if (!editor) return null;

  const insertTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  return (
    <div>
      {/* 표가 활성화되어 있으면 컨텍스트 메뉴 표시 */}
      {editor.isActive('table') && <TableContextMenu editor={editor} />}

      {/* 툴바의 표 버튼 */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowSizeSelector(!showSizeSelector)}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            backgroundColor: editor.isActive('table') ? '#dbeafe' : 'white',
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="표 삽입"
        >
          📊 표
        </button>

        {/* 표 크기 선택기 */}
        {showSizeSelector && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
              onClick={() => setShowSizeSelector(false)}
            />
            <TableSizeSelector onSelect={insertTable} onClose={() => setShowSizeSelector(false)} />
          </>
        )}
      </div>
    </div>
  );
};

export default TableMenu;