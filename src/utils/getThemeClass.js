export const THEME_CLASSES = {
  light: {
    active: "bg-gray-200 text-gray-900",
    inactive: "hover:text-black hover:bg-gray-100"
  },
  dark: {
    active: "bg-gray-900 text-white",
    inactive: "hover:text-white hover:bg-white/5"
  }
};

export default function getThemeClass(isCurrent, theme) {
  return THEME_CLASSES[theme]?.[isCurrent ? 'active' : 'inactive'] ?? '';
}
