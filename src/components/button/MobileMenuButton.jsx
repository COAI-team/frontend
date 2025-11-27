import { MobileMenuButtonPropTypes } from "../../utils/propTypes";
import { DisclosureButton } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function MobileMenuButton({ theme }) {
    return (
        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton
                className={`group relative inline-flex items-center justify-center rounded-md p-2 
                focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500
                ${
                    theme === "light"
                        ? "text-gray-700 hover:bg-gray-100 hover:text-black"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
            >
                <Bars3Icon className="size-6 block group-data-[open]:hidden" />
                <XMarkIcon className="size-6 hidden group-data-[open]:block" />
            </DisclosureButton>
        </div>
    );
}

MobileMenuButton.propTypes = MobileMenuButtonPropTypes;