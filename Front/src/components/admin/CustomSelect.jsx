import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";

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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

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
        className={`w-full flex items-center gap-2.5 bg-muted/60 border rounded-xl px-3.5 py-2.5 text-[15px] transition-all duration-200 cursor-pointer
          ${isOpen
            ? "border-primary/50 ring-1 ring-primary/20 bg-muted/70"
            : "border-border hover:border-primary/30 hover:bg-muted"
          }`}
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground/80 flex-shrink-0" />}

        <span className={`flex-1 text-left truncate ${selectedOption ? "text-foreground" : "text-muted-foreground"}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.icon && <span className="text-[13px]">{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
        </span>

        {clearable && value && (
          <span
            onClick={handleClear}
            className="p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
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
            className="absolute z-[60] top-[calc(100%+6px)] left-0 w-full bg-card border border-border rounded-xl shadow-2xl shadow-black/20 overflow-hidden"
          >
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-border">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("admin.form.search", "Ҷустуҷӯ...")}
                  className="w-full bg-muted/60 border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-all"
                />
              </div>
            )}

            {/* Options list */}
            <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {/* Empty placeholder option */}
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[15px] transition-all duration-150 cursor-pointer
                    ${!value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <span className="flex-1 text-left text-[13px]">{placeholder}</span>
                  {!value && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-muted-foreground/80">
                  {t("common.not_found")}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[15px] transition-all duration-150 cursor-pointer
                        ${isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      {opt.icon && (
                        <span className="w-5 flex-shrink-0 text-center">{opt.icon}</span>
                      )}
                      <span className="flex-1 text-left truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
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
