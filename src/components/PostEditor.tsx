import { useForm, Controller } from "react-hook-form";
import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useDebounce } from "../hooks/useDebounce";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs } from "./Tabs";
import { Loading } from "./Loading";
import { signIn, useSession } from "next-auth/react";
import { ImageHidesOnError } from "./ImageHidesOnError";
import { NotBannedOnlyButton } from "./NotBannedOnlyButton";
import dynamic from "next/dynamic";
import { usePostRedirect } from "../hooks/useRedirects";
import { GET_POST_PLACEHOLDER } from "../utils/placeholders";

const Markdown = dynamic(() => import("./Markdown").then((x) => x.Markdown));

export const createPostSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must have at least 2 characters" })
    .max(256, { message: "Title must have at most 256 characters" }),
  content: z
    .string()
    .max(4096, { message: "Content must have at most 4096 characters" }),
  communityName: z.string(),
});

export type createPostForm = z.infer<typeof createPostSchema>;

export const PostEditor: React.FC<{
  defaultCommunity?: string;
}> = ({ defaultCommunity }) => {
  const [isFocused, setFocused] = useState<boolean>(false);
  const optionsDivRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  const currentCommunity = useMemo(() => {
    return searchCommunityQuery.data?.find((com) => com.name === debouncedName);
  }, [debouncedName, searchCommunityQuery]);

  const trpcContext = trpc.useContext();

  const postRedirect = usePostRedirect();
  const createPostMutation = trpc.post.createPost.useMutation({
    retry: false,
    onSuccess: (data) => {
      trpcContext.post.getPosts.invalidate();

      postRedirect({
        ...data,
        community: { ...GET_POST_PLACEHOLDER.community },
      });
    },
    onError: (err) => {
      setError("communityName", { message: err.shape?.message });
    },
    onMutate: console.log,
  });

  const onSubmit = (data: createPostForm) => {
    createPostMutation.mutate(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-auto flex w-full max-w-3xl flex-col items-center gap-1 rounded border-2 border-transparent bg-zinc-900 p-2 pb-0 text-white md:border-zinc-800 md:p-8 md:pb-4"
      ref={formRef}
    >
      <div className="flex w-full items-center">
        <h2 className="my-2 w-full text-lg text-white md:text-2xl">
          Create a post
        </h2>

        <NotBannedOnlyButton
          onClick={() => formRef.current?.requestSubmit()}
          Child={(props) => (
            <button
              {...props}
              type="button"
              className="text-md w-16 rounded bg-indigo-700 p-2 text-white disabled:bg-indigo-500 disabled:text-gray-400 md:w-24 md:text-lg"
              disabled={!formState.isValid || createPostMutation.isLoading}
            >
              Create
            </button>
          )}
        />
      </div>
      <Loading size="small" show={createPostMutation.isLoading} />
      <div className="flex max-h-[250vh] w-full origin-top flex-col gap-2">
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
                <div className="flex w-full items-center gap-1">
                  {currentCommunity?.logo && (
                    <div className="relative h-8 w-8">
                      <ImageHidesOnError
                        loader={({ src }) => src}
                        src={currentCommunity.logo}
                        alt={`Community logo of /b/${currentCommunity.name}`}
                        fill
                        className="rounded-full object-cover"
                        priority
                      />
                    </div>
                  )}
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
                </div>
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
                preview:
                  field.value.length > 0 ? (
                    <Markdown source={field.value} />
                  ) : (
                    <p></p>
                  ),
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
