import { useForm, Controller } from "react-hook-form";
import { useRef, useState } from "react";
import { z } from "zod";
import { useDebounce } from "../hooks/useDebounce";
import { cx, slugify } from "../utils/general";
import { trpc } from "../utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs } from "./Tabs";
import { useRouter } from "next/router";
import { Loading } from "./Loading";
import { Markdown } from "./Markdown";
import { AiFillCaretDown } from "react-icons/ai";
import { signIn, useSession } from "next-auth/react";

export const createPostSchema = z.object({
  title: z.string().min(2).max(256),
  content: z.string().max(4096),
  communityName: z.string(),
});

export type createPostForm = z.infer<typeof createPostSchema>;

export const PostEditor: React.FC<{
  defaultCommunity?: string;
  defaultOpen: boolean;
}> = ({ defaultCommunity, defaultOpen }) => {
  const [isFocused, setFocused] = useState<boolean>(false);
  const [isOpen, setOpen] = useState<boolean>(defaultOpen);
  const optionsDivRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { status: authStatus } = useSession();

  const {
    control,
    handleSubmit,
    setError,
    watch,
    getValues,
    setValue,
    formState,
  } = useForm<createPostForm>({
    mode: "onTouched",
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      communityName: defaultCommunity ?? "",
      content: "",
      title: "",
    },
  });

  const searchCommunityQueryInput = watch("communityName");
  const setSearchCommunityQueryInput = (value: string) =>
    setValue("communityName", value);
  const debouncedName = useDebounce(searchCommunityQueryInput, 1200);

  const searchCommunityQuery = trpc.community.findCommunity.useQuery(
    { name: debouncedName },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      placeholderData: [],
      onSuccess(data) {
        const communityName = getValues("communityName");
        if (
          communityName.length &&
          data.filter((community) => community.name === communityName)
            .length === 0
        ) {
          setError("communityName", { message: "Community not found." });
        }
      },
    }
  );

  const trpcContext = trpc.useContext();

  const createPostMutation = trpc.post.createPost.useMutation({
    onSuccess: (data) => {
      trpcContext.post.getPosts.invalidate();
      router.push(
        `/b/${searchCommunityQueryInput}/post/${data.id}/${slugify(data.title)}`
      );
    },
    onError: (err) =>
      setError("communityName", { message: err.shape?.message }),
  });

  const onSubmit = (data: createPostForm) => {
    createPostMutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-auto flex w-full max-w-3xl flex-col items-center gap-1 rounded border-2 border-transparent bg-zinc-900 p-2 pb-0 text-white md:border-zinc-800 md:p-8 md:pb-4"
    >
      <div className="flex w-full items-center">
        {defaultOpen ? (
          <h2 className="my-2 w-full text-lg text-white md:text-2xl">
            Create a post
          </h2>
        ) : (
          <button
            className={cx(
              "enabled:group flex w-full items-center gap-4 pl-0 text-left text-xl disabled:cursor-not-allowed"
            )}
            onClick={() => setOpen((prev) => !prev)}
            disabled={authStatus !== "authenticated"}
          >
            <span className="p-2 transition-colors group-hover:bg-zinc-800">
              <AiFillCaretDown
                className={cx("transition-transform", isOpen && "rotate-180")}
              />
            </span>
            <h2 className="my-2 w-full text-lg text-white md:text-2xl">
              Create a post
            </h2>
          </button>
        )}
        <button
          type="submit"
          className="text-md w-16 rounded bg-indigo-700 p-1 text-white disabled:bg-indigo-500 disabled:text-gray-400 md:w-24 md:p-2 md:text-lg"
          disabled={!formState.isValid || createPostMutation.isLoading}
        >
          Create
        </button>
      </div>
      <Loading size="small" show={createPostMutation.isLoading} />
      <div
        className={cx(
          "flex w-full origin-top flex-col gap-2 transition-all",
          defaultOpen || isOpen
            ? "visible max-h-[250vh] scale-y-100"
            : "invisible max-h-0 scale-y-0"
        )}
      >
        <hr className="my-2 w-full" />
        <div
          className="relative mb-8 flex w-full flex-col"
          onBlur={(e) => {
            if (
              !e.relatedTarget ||
              !e.currentTarget.contains(e.relatedTarget)
            ) {
              setFocused(false);
            }
          }}
        >
          <Controller
            name="communityName"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <div
                  className={cx(
                    "overflow-hidden text-red-400 transition-all",
                    fieldState.error?.message ? "h-8" : "h-0"
                  )}
                >
                  {fieldState.error?.message}
                </div>
                <input
                  autoComplete="off"
                  type="text"
                  className={cx(
                    "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                    fieldState.error
                      ? "border-red-600"
                      : "border-zinc-500 focus:border-zinc-300"
                  )}
                  placeholder="Choose community..."
                  {...field}
                  onFocus={() => setFocused(true)}
                  onKeyDown={(e) => {
                    if (!optionsDivRef.current?.children.length) return;
                    if (e.key === "ArrowDown") {
                      (
                        optionsDivRef.current?.children[0] as HTMLDivElement
                      ).focus();
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
              </>
            )}
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

        <Controller
          control={control}
          name="title"
          render={({ field, fieldState }) => (
            <>
              <div
                className={cx(
                  "overflow-hidden text-red-400 transition-all",
                  fieldState.error?.message ? "h-8" : "h-0"
                )}
              >
                {fieldState.error?.message}
              </div>
              <input
                autoComplete="off"
                {...field}
                className={cx(
                  "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                  fieldState.error
                    ? "border-red-600"
                    : "border-zinc-500 focus:border-zinc-300"
                )}
                type="text"
                placeholder="Title"
              />
            </>
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <Tabs
              defaultValue="editor"
              data={{
                editor: (
                  <>
                    <div
                      className={cx(
                        "overflow-hidden text-red-400 transition-all",
                        fieldState.error?.message ? "h-8" : "h-0"
                      )}
                    >
                      {fieldState.error?.message}
                    </div>
                    <textarea
                      autoComplete="off"
                      {...field}
                      className={cx(
                        "max-h-[50vh] min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                        fieldState.error
                          ? "border-red-600"
                          : "border-zinc-500 focus:border-zinc-300"
                      )}
                      placeholder="Your awesome post"
                    ></textarea>
                  </>
                ),
                preview: <Markdown source={field.value} />,
              }}
            />
          )}
        />
      </div>
      {authStatus !== "authenticated" && (
        <p className="w-full text-left text-sm">
          <button
            onClick={() => signIn()}
            className="cursor-pointer text-indigo-500 hover:underline"
          >
            Log in
          </button>{" "}
          to post
        </p>
      )}
    </form>
  );
};
