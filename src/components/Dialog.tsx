import { useEffect } from "react";
import { cx } from "../utils/general";

export const Dialog: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  close: () => void;
}> = ({ children, isOpen, close }) => {
  useEffect(() => {
    document.body.style.overflowY = isOpen ? "hidden" : "";
    document.body.style.paddingRight = isOpen ? "12px" : "0px";
    return () => {
      document.body.style.overflowY = "";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);
  return (
    <div
      onClick={(e) => {
        if (e.currentTarget === e.target) close();
      }}
      className={cx(
        "fixed left-0 right-0 bottom-0 top-0 z-50 flex max-h-screen items-start justify-center overflow-y-scroll bg-zinc-900 bg-opacity-80 py-4 transition-all duration-200",
        isOpen ? "opacity-1 visible" : "invisible opacity-0"
      )}
    >
      {children}
    </div>
  );
};
