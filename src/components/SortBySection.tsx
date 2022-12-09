import { useEffect, useRef } from "react";
import { cx } from "../utils/general";
import type { RouterInputs } from "../utils/trpc";

export type SortingOptions = RouterInputs["post"]["getPosts"]["sort"];
export const SortBySection: React.FC<{
  setSortBy: (val: SortingOptions) => void;
  sortBy: SortingOptions;
  isLoading: boolean;
}> = ({ setSortBy, sortBy, isLoading }) => {
  const activeSortByRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeSortByRef.current) {
      const activeButton = activeSortByRef.current;
      const parent = activeButton.parentElement as HTMLDivElement;
      const buttonRect = activeButton.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const desiredCenter = parentRect.width / 2 + parentRect.left;
      const buttonCenter = buttonRect.width / 2 + buttonRect.left;
      parent.scrollBy({
        behavior: "smooth",
        left: buttonCenter - desiredCenter,
      });
    }
  }, [sortBy, activeSortByRef, isLoading]);

  return (
    <div className="hidden-scroller justify-left mt-4 flex w-full flex-1 gap-2 overflow-scroll">
      <div className="w-[50%] shrink-0 basis-[50%]"></div>
      {(["new", "hot", "controversial"] as const).map((value) => (
        <button
          className={cx(
            "rounded-full px-6 py-0.5 transition-all disabled:opacity-50 disabled:contrast-50",
            value === sortBy
              ? "bg-zinc-100 text-black"
              : "bg-zinc-700 text-white"
          )}
          key={value}
          onClick={() => {
            setSortBy(value);
          }}
          ref={value === sortBy ? activeSortByRef : undefined}
          disabled={isLoading}
        >
          {value}
        </button>
      ))}
      <div className="w-[50%] shrink-0 basis-[50%]"></div>
    </div>
  );
};
