import { useRef, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";

export const PostEditor: React.FC = () => {
  const [isFocused, setFocused] = useState<boolean>(false);
  const [searchCommunityQueryInput, setSearchCommunityQueryInput] =
    useState<string>("");
  const optionsDivRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedName = useDebounce(searchCommunityQueryInput, 1200);
  console.log(debouncedName);
  const searchCommunityQuery = trpc.community.findCommunity.useQuery(
    { name: debouncedName },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      placeholderData: [],
    }
  );

  return (
    <div className="my-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded border-2 border-zinc-800 bg-zinc-900 p-8">
      <div className="flex w-full">
        <h2 className="my-2 w-full text-3xl text-white">Create a post</h2>
      </div>
      <hr className="my-2 w-full" />
      <div
        className="relative mb-8 flex w-full flex-col"
        onBlur={(e) => {
          if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
            setFocused(false);
          }
        }}
      >
        <input
          type="text"
          className="w-full rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
          placeholder="Choose community..."
          onChange={(e) => setSearchCommunityQueryInput(e.currentTarget.value)}
          value={searchCommunityQueryInput}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (!optionsDivRef.current?.children.length) return;
            if (e.key === "ArrowDown") {
              (optionsDivRef.current?.children[0] as HTMLDivElement).focus();
              e.preventDefault();
            } else if (e.key === "ArrowUp") {
              (
                optionsDivRef.current?.children[
                  optionsDivRef.current?.children.length - 1
                ] as HTMLDivElement
              ).focus();
              e.preventDefault();
            }
          }}
          ref={searchInputRef}
        />
        <div
          className={cx(
            "absolute top-full z-10 flex max-h-44 w-full origin-top flex-col gap-1 overflow-y-scroll bg-zinc-800 transition-transform",
            !isFocused && "scale-y-0"
          )}
          ref={optionsDivRef}
        >
          {searchCommunityQuery.data?.map((option, index) => (
            <div
              key={option.id}
              className="cursor-pointer p-2 outline-none hover:bg-zinc-700 focus:bg-zinc-700"
              tabIndex={index}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  const nextOption = optionsDivRef.current?.children[
                    (index + 1) % optionsDivRef.current?.children.length
                  ] as HTMLDivElement;
                  nextOption.focus();
                  nextOption.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  e.preventDefault();
                } else if (e.key === "ArrowUp") {
                  const nextOption = optionsDivRef.current?.children[
                    (index - 1 + optionsDivRef.current?.children.length) %
                      optionsDivRef.current?.children.length
                  ] as HTMLDivElement;
                  nextOption.focus();
                  nextOption.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  e.preventDefault();
                } else if (e.key === "Enter" || e.key === " ") {
                  setSearchCommunityQueryInput(option.name);
                  (document.activeElement as HTMLElement).blur();
                } else if (e.key === "Escape") {
                  (document.activeElement as HTMLElement).blur();
                }
              }}
              onClick={() => {
                setSearchCommunityQueryInput(option.name);
                (document.activeElement as HTMLElement).blur();
              }}
            >
              {option.name}
            </div>
          ))}
        </div>
      </div>

      <input
        className="w-full rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
        type="text"
        placeholder="Title"
      />
      <textarea
        className="min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
        placeholder="Your awesome post"
      ></textarea>

      <button className="mt-4 w-24 rounded bg-indigo-700 p-2 text-white">
        Create
      </button>
    </div>
  );
};
