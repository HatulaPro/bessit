import { useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { cx } from "../utils/general";

export const Dialog: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  close: () => void;
}> = ({ children, isOpen, close }) => {
  useEffect(() => {
    document.body.style.overflowY = isOpen ? "hidden" : "";
    document.body.style.paddingRight = isOpen ? "12px" : "";

    return () => {
      document.body.style.overflowY = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);
  const debouncedOpen = useDebounce(isOpen, 150);

  return isOpen || debouncedOpen ? (
    <div
      onClick={(e) => {
        if (e.currentTarget === e.target) close();
      }}
      className={cx(
        "fixed inset-0 z-50 flex max-h-screen items-start justify-center overflow-y-auto bg-zinc-900 bg-opacity-95 py-4 transition-all duration-200 md:bg-opacity-80",
        isOpen && debouncedOpen
          ? "opacity-1 visible"
          : "invisible bottom-44 opacity-0"
      )}
    >
      {children}
    </div>
  ) : null;
};
