import { DisclosurePanel } from "@headlessui/react";
import { NavLinks } from "./NavLinks";
import { MobileNavPropTypes } from "../../utils/propTypes";

export default function MobileNav({ navigation, onLinkClick }) {
    return (
        <DisclosurePanel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
                <NavLinks
                    mobile
                    navigation={navigation}
                    onLinkClick={onLinkClick}
                />
            </div>
        </DisclosurePanel>
    );
}

MobileNav.propTypes = MobileNavPropTypes;