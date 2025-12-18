import { memo, useMemo } from "react";
import { MobileMenuButtonPropTypes } from "../../utils/propTypes";
import { DisclosureButton } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const MobileMenuButton = ({ theme }) => {
  // ✅ useMemo로 클래스명 계산 메모이제이션
  const buttonClassName = useMemo(() =>
      `group relative inline-flex items-center justify-center rounded-md p-2 
        focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500
        ${
        theme === "light"
          ? "text-gray-700 hover:bg-gray-100 hover:text-black"
          : "text-gray-400 hover:bg-white/5 hover:text-white"
      }`,
    [theme]
  );

  return (
    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
      <DisclosureButton
        className={buttonClassName}
        aria-label="메뉴 열기" // ✅ 접근성: 버튼 레이블
      >
        <span className="sr-only">메뉴 열기</span> {/* ✅ 접근성: 스크린 리더용 텍스트 */}
        <Bars3Icon
          className="size-6 block group-data-open:hidden"
          aria-hidden="true" // ✅ 접근성: 장식용 아이콘
        />
        <XMarkIcon
          className="size-6 hidden group-data-open:block"
          aria-hidden="true" // ✅ 접근성: 장식용 아이콘
        />
      </DisclosureButton>
    </div>
  );
};

MobileMenuButton.propTypes = MobileMenuButtonPropTypes;

export default memo(MobileMenuButton);
