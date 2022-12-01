import { cx } from "../utils/general";

export const Loading: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <div
      className={cx(
        "w-5 animate-spin rounded-full border-[3px] border-white border-t-slate-500 transition-all",
        show ? "h-5" : "h-0 opacity-0"
      )}
    ></div>
  );
};
