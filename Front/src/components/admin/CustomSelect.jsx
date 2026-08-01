import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * Custom dark-themed select dropdown for admin panel.
 * Replaces native <select> with a styled, accessible dropdown.
 */
const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "— Select —",
  icon: Icon = null,
  className = "",
  searchable = false,
  clearable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options when searchable
  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2.5 bg-white/[0.04] border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 cursor-pointer
          ${isOpen
            ? "border-indigo-500/50 ring-1 ring-indigo-500/20 bg-white/[0.06]"
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
          }`}
      >
        {Icon && <Icon className="w-4 h-4 text-white/20 flex-shrink-0" />}

        <span className={`flex-1 text-left truncate ${selectedOption ? "text-white" : "text-white/30"}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span className="text-xs">{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>

        {clearable && value && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-md hover:bg-white/10 text-white/30 hover:text-white/60 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-[60] top-[calc(100%+6px)] left-0 w-full bg-[#0f172a] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-white/[0.06]">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ҷустуҷӯ..."
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:border-indigo-500/40 transition-all"
                />
              </div>
            )}

            {/* Options list */}
            <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {/* Empty placeholder option */}
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all duration-150 cursor-pointer
                    ${!value
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
                    }`}
                >
                  <span className="flex-1 text-left text-xs">{placeholder}</span>
                  {!value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-white/20">
                  Ёфт нашуд
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all duration-150 cursor-pointer
                        ${isSelected
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                        }`}
                    >
                      {opt.icon && (
                        <span className="w-5 flex-shrink-0 text-center">{opt.icon}</span>
                      )}
                      <span className="flex-1 text-left truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
