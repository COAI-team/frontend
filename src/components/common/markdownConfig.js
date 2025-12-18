import { useMemo } from "react";
import { Strong, Paragraph, CodeInline } from './MarkdownRenderers';

// ✅ 컴포넌트 참조만 사용 (JSX 없음)
const createMarkdownComponents = () => ({
  strong: Strong,
  p: Paragraph,
  code: CodeInline,
});

// ✅ Hook
export const useMarkdownComponents = () => {
  return useMemo(() => createMarkdownComponents(), []);
};

// ✅ 정적 객체
export const MarkdownComponents = createMarkdownComponents();
