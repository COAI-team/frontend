import { memo } from "react";
import { ParagraphPropTypes, StrongPropTypes, CodeInlinePropTypes } from "../../utils/propTypes";

// ✅ 기존 컴포넌트들
const Strong = memo(({ children }) => {
  return <strong className="font-bold">{children}</strong>;
});

const Paragraph = memo(({ children }) => {
  return <p className="mb-1">{children}</p>;
});

// ✅ 👈 CodeInline 추가 (이게 없어서 에러!)
const CodeInline = memo(({ children, ...props }) => {
  return (
    <code
      className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-sm"
      {...props}
    >
      {children}
    </code>
  );
});

Strong.propTypes = StrongPropTypes;
Paragraph.propTypes = ParagraphPropTypes;
CodeInline.propTypes = CodeInlinePropTypes;

Strong.displayName = 'Strong';
Paragraph.displayName = 'Paragraph';
CodeInline.displayName = 'CodeInline';

export { Strong, Paragraph, CodeInline };
