import { cx } from "../utils/general";

const sizeOf = {
  small: { w: "w-5", h: "h-5" },
  large: { w: "w-10", h: "h-10" },
};
export const Loading: React.FC<{
  show: boolean;
  size: keyof typeof sizeOf;
}> = ({ show, size }) => {
  return (
    <div
      className={cx(
        sizeOf[size].w,
        "m-auto rounded-full border-[3px] border-slate-700 border-t-white transition-all",
        show ? `${sizeOf[size].h} animate-spin` : "h-0 border-0 opacity-0"
      )}
    ></div>
  );
};
