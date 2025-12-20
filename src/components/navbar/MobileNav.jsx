import { memo } from "react";
import { DisclosurePanel } from "@headlessui/react";
import NavLinks from "./NavLinks";
import { MobileNavPropTypes } from "../../utils/propTypes";

const MobileNav = ({ navigation, onLinkClick }) => {
  return (
    <DisclosurePanel className="sm:hidden" id="mobile-nav">
      <div
        className="space-y-1 px-2 pt-2 pb-3 animate-in slide-in-from-top-4 duration-300"
        role="menu"
        aria-label="모바일 네비게이션 메뉴"
      >
        <NavLinks
          mobile={true}  // ✅ 명시적 prop 전달
          navigation={navigation}
          onLinkClick={onLinkClick}
        />
      </div>
    </DisclosurePanel>
  );
};

MobileNav.propTypes = MobileNavPropTypes;

MobileNav.displayName = 'MobileNav';

export default memo(MobileNav);
