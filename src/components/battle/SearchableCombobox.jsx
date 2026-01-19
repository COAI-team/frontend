import { useEffect, useMemo, useRef, useState } from "react";
import { getDifficultyColorClasses } from "../../constants/difficultyColors";

export default function SearchableCombobox({
  label,
  items = [],
  value,
  onChange,
  placeholder = "",
  helperText,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(null);

  const selected = useMemo(
    () => items.find((i) => String(i.value) === String(value)),
    [items, value]
  );

  useEffect(() => {
    setInputValue(selected ? selected.label : "");
  }, [selected]);

  useEffect(() => {
    if (open && containerRef.current) {
      setDropdownWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const filtered = useMemo(() => {
    const raw = inputValue.trim().toLowerCase();
    const selectedLabel = (selected?.label || "").trim().toLowerCase();
    const q = open && selectedLabel && raw === selectedLabel ? "" : raw;
    if (!q) return items;
    return items.filter((item) => {
      const searchText =
        (item.searchText ||
          `${item.label ?? ""} ${item.subLabel ?? ""} ${item.badge ?? ""}` ||
          "").toLowerCase();
      return searchText.includes(q);
    });
  }, [items, inputValue, open, selected?.label]);

  const handleSelect = (item) => {
    onChange?.(item.value);
    setInputValue(item.label);
    setOpen(false);
  };

  const dropdown = (
    <div
      className="absolute z-50 mt-1 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#3f3f46] rounded shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] max-h-64 overflow-auto"
      style={{ width: dropdownWidth || "100%", left: 0 }}
    >
      <ul className="divide-y divide-gray-200 dark:divide-[#3f3f46]">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">검색 결과 없음</li>
        )}
        {filtered.map((item) => (
          <li
            key={item.value}
            title={`${item.label}${item.subLabel ? " · " + item.subLabel : ""}`}
          >
            <button
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between"
            >
              <div className="truncate">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.label}</div>
                {item.subLabel && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.subLabel}</div>
                )}
              </div>
              {item.badge && (() => {
                const c = getDifficultyColorClasses(item.badge);
                return (
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full border ${c.bg} ${c.text} ${c.border} truncate max-w-[120px]`}
                    title={item.badge}
                  >
                    {item.badge}
                  </span>
                );
              })()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</label>}
      <div className="relative">
        <div className="flex items-center border rounded px-3 py-2 focus-within:ring bg-white dark:bg-zinc-800 border-gray-200 dark:border-[#3f3f46]">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || "검색 또는 선택"}
            className="flex-1 min-w-0 outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 truncate bg-transparent"
            title={inputValue}
          />
          {selected?.badge && (() => {
            const c = getDifficultyColorClasses(selected.badge);
            return (
              <span
                className={`ml-2 text-xs px-2 py-1 rounded-full border ${c.bg} ${c.text} ${c.border} truncate max-w-[120px]`}
                title={selected.badge}
              >
                {selected.badge}
              </span>
            );
          })()}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              inputRef.current?.focus();
              setOpen((v) => !v);
            }}
            className="text-gray-500 dark:text-gray-400 text-sm ml-2"
            aria-label="드롭다운"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
        {open && dropdown}
      </div>
      {helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
}
