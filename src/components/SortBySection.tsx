import { useEffect, useRef, useState } from "react";
import { cx } from "../utils/general";
import { AiFillCaretDown } from "react-icons/ai";
import type { RouterInputs } from "../utils/trpc";

export type SortingOptions = RouterInputs["post"]["getPosts"]["sort"];
export type PostsFromLastOptions =
  RouterInputs["post"]["getPosts"]["postsFromLast"];

const TIME_FILTERS: Record<PostsFromLastOptions, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  "all time": "All Time",
};

export const SortBySection: React.FC<{
  setSortBy: (val: SortingOptions) => void;
  sortBy: SortingOptions;
  setTimeFilter: (val: PostsFromLastOptions) => void;
  timeFilter: PostsFromLastOptions;
  isLoading: boolean;
}> = ({ timeFilter, setTimeFilter, setSortBy, sortBy, isLoading }) => {
  const activeSortByRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setFocused] = useState<boolean>(false);

  useEffect(() => {
    if (activeSortByRef.current) {
      const activeButton = activeSortByRef.current;
      const parent = activeButton.parentElement as HTMLDivElement;
      const buttonRect = activeButton.getBoundingClientRect();
      const parentRect = (
        parent.parentElement as HTMLDivElement
      ).getBoundingClientRect();
      const desiredCenter = parentRect.width / 2 + parentRect.left;
      const buttonCenter = buttonRect.width / 2 + buttonRect.left;
      parent.scrollBy({
        behavior: "smooth",
        left: buttonCenter - desiredCenter,
      });
    }
  }, [sortBy, activeSortByRef, isLoading]);

  return (
    <div className="w-full max-w-3xl bg-zinc-900 pb-2 text-white">
      <div
        className="relative ml-auto mr-2 mt-4 mb-3 w-32 text-base md:text-lg"
        onBlur={(e) => {
          if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            setFocused(false);
          }
        }}
      >
        <button
          onClick={() => setFocused(!isFocused)}
          className={cx(
            "flex w-full items-center justify-evenly border-[1px] border-zinc-500 py-1.5 hover:enabled:bg-zinc-800",
            isFocused ? "rounded-t" : "rounded",
            isLoading && "contrast-50"
          )}
          disabled={isLoading}
        >
          {TIME_FILTERS[timeFilter]}
          <AiFillCaretDown className="text-sm md:text-base" />
        </button>
        <div
          className={cx(
            "absolute top-full z-20 max-h-44 w-full origin-top overflow-y-auto rounded-b border-[1px] border-t-0 border-zinc-500 bg-zinc-900 transition-transform",
            isFocused && !isLoading ? "scale-y-100" : "scale-y-0"
          )}
        >
          {Object.entries(TIME_FILTERS).map(
            ([apiName, displayName]) =>
              apiName !== timeFilter && (
                <button
                  key={apiName}
                  className="w-full border-t-[1px] border-t-zinc-700 py-1.5 hover:bg-zinc-800"
                  onClick={() => {
                    setTimeFilter(apiName as keyof typeof TIME_FILTERS);
                    setFocused(false);
                  }}
                >
                  {displayName}
                </button>
              )
          )}
        </div>
      </div>
      <div className="hidden-scroller justify-left flex w-full flex-1 gap-2 overflow-scroll">
        <div className="w-[60%] shrink-0 basis-[60%]"></div>
        {(["new", "hot", "moot"] as const).map((value) => (
          <button
            className={cx(
              "text-md rounded-full py-1 px-5 transition-all disabled:opacity-50 disabled:contrast-50 md:px-6 md:text-lg",
              value === sortBy
                ? "bg-zinc-100 text-black"
                : "bg-zinc-600 text-white"
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
        <div className="w-[60%] shrink-0 basis-[60%]"></div>
      </div>
    </div>
  );
};
