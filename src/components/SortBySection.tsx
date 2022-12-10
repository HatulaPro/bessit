import { useState } from "react";
import { cx } from "../utils/general";
import { AiFillCaretDown } from "react-icons/ai";
import type { RouterInputs } from "../utils/trpc";
import { BsClock, BsExclamationTriangle, BsStars } from "react-icons/bs";
import type { IconType } from "react-icons/lib";

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

const SORT_OPTIONS: Record<SortingOptions, IconType> = {
  new: BsClock,
  moot: BsExclamationTriangle,
  hot: BsStars,
};

export const SortBySection: React.FC<{
  setSortBy: (val: SortingOptions) => void;
  sortBy: SortingOptions;
  setTimeFilter: (val: PostsFromLastOptions) => void;
  timeFilter: PostsFromLastOptions;
  isLoading: boolean;
}> = ({ timeFilter, setTimeFilter, setSortBy, sortBy, isLoading }) => {
  const [isFocused, setFocused] = useState<boolean>(false);

  function setCorrectSortingOption(val: SortingOptions) {
    if (val === "moot") {
      setTimeFilter("day");
    } else if (val === "new") {
      setTimeFilter("all time");
    } else if (val === "hot") {
      setTimeFilter("day");
    }

    setSortBy(val);
  }

  return (
    <div className="justify-left mt-4 flex w-full max-w-3xl flex-1 items-center gap-2 bg-zinc-800 px-0.5 py-3 text-white md:rounded-md md:px-2">
      {Object.entries(SORT_OPTIONS).map(([sortFilter, Icon]) => (
        <button
          className={cx(
            "my-0.5 flex items-center gap-1 rounded-full py-0.5 px-2 text-base font-bold transition-all disabled:opacity-50 disabled:contrast-50 md:px-3 md:text-lg",
            sortFilter === sortBy
              ? "bg-zinc-700 text-white"
              : "bg-transparent text-zinc-500 hover:bg-zinc-700"
          )}
          key={sortFilter}
          onClick={() => {
            setCorrectSortingOption(sortFilter as keyof typeof SORT_OPTIONS);
          }}
          disabled={isLoading}
        >
          <Icon />
          {sortFilter}
        </button>
      ))}
      {sortBy === "hot" && (
        <div
          className="relative ml-auto mr-2 w-24 text-sm md:w-28 md:text-base"
          onBlur={(e) => {
            if (
              !e.relatedTarget ||
              !e.currentTarget.contains(e.relatedTarget)
            ) {
              setFocused(false);
            }
          }}
        >
          <button
            onClick={() => setFocused(!isFocused)}
            className={cx(
              "flex w-full items-center justify-evenly border-[1px] border-zinc-500 py-1 hover:enabled:bg-zinc-800",
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
                    className="w-full border-t-[1px] border-t-zinc-700 py-1 hover:bg-zinc-800"
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
      )}
    </div>
  );
};
