import { useMemo, memo } from "react";
import { RuleItemPropTypes } from "../../utils/propTypes";

const RuleItem = ({ ok, text }) => {
  // ✅ useMemo로 클래스명 메모이제이션
  const className = useMemo(() =>
      ok ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400",
    [ok]
  );

  // ✅ useMemo로 아이콘 메모이제이션
  const icon = useMemo(() =>
      ok ? "✓" : "✗",
    [ok]
  );

  return (
    <li className={className}>
      <span aria-hidden="true">{icon}</span>
      <span className="ml-1">{text}</span>
    </li>
  );
};

RuleItem.propTypes = RuleItemPropTypes;

export default memo(RuleItem);
