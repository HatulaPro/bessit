import type { CommentVote, Community, Post, User } from "@prisma/client";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { z } from "zod";
import { Loading } from "../../../../components/Loading";
import { NotFoundMessage } from "../../../../components/NotFoundMessage";
import { SinglePost } from "../../../../components/PostsViewer";
import { trpc } from "../../../../utils/trpc";
import superjson from "superjson";
import { IoMdClose } from "react-icons/io";
import type { CommunityPosts } from "../../../../hooks/useCommunityPosts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { cx, slugify, timeAgo } from "../../../../utils/general";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BsDot, BsChatLeft, BsShare, BsArrowUpCircle } from "react-icons/bs";
import Image from "next/image";
import { Markdown } from "../../../../components/Markdown";
import { CommentLikeButton } from "../../../../components/CommentLikeButton";
import { LoggedOnlyButton } from "../../../../components/LoggedOnlyButton";

const PostPage: NextPage = () => {
  const postTopRef = useRef<HTMLDivElement>(null);
  const {
    post,
    isLoading,
    is404,
    comments,
    currentMainCommentId: currentParentCommentId,
    setCurrentMainCommentId: setCurrentParentCommentId,
  } = useCachedPost(postTopRef.current);
  const pageTitle = `Bessit | ${post?.title ?? "View Post"}`;
  const router = useRouter();
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="View a post on the Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-full w-full flex-col items-center bg-zinc-900 pt-12 pb-2 text-white md:pt-16">
        {isLoading.post && <Loading show size="large" />}
        {is404 && (
          <NotFoundMessage message="This post does not seem to exist" />
        )}
        {post && (
          <PostPageContent
            setCurrentParentCommentId={setCurrentParentCommentId}
            currentParentCommentId={currentParentCommentId}
            comments={comments}
            post={post}
            isLoadingComments={isLoading.comments}
          />
        )}
        <div
          className="absolute m-auto h-0 w-0 bg-black"
          ref={postTopRef}
        ></div>

        <button
          onClick={() => {
            if (!post) return router.back();
            router.replace(`/b/${post.community.name}`);
          }}
          className="absolute right-12 top-20 hidden items-center gap-1 rounded-xl px-2 py-1 text-white hover:bg-white hover:bg-opacity-10 md:flex"
        >
          <IoMdClose className="text-2xl" />
          <span className="text-sm">Back</span>
        </button>
      </main>
    </>
  );
};

export default PostPage;

const PostPageContent: React.FC<{
  post: CommunityPosts["posts"][number];
  comments: ReturnType<typeof useCachedPost>["comments"];
  setCurrentParentCommentId: (x: string | null) => void;
  currentParentCommentId: string | null;
  isLoadingComments: boolean;
}> = ({
  post,
  comments,
  setCurrentParentCommentId,
  currentParentCommentId,
  isLoadingComments,
}) => {
  const { status: authStatus } = useSession();
  const [openCreateCommentId, setOpenCreateCommentId] = useState<string | null>(
    null
  );

  return (
    <div className="w-full">
      <SinglePost post={post} isMain={true} />
      {currentParentCommentId !== null && (
        <button
          className="text-md m-2 mx-auto flex flex-col items-center justify-center gap-2 text-center hover:underline"
          onClick={() => setCurrentParentCommentId(null)}
        >
          <BsArrowUpCircle className="text-2xl" />
          Back to main thread
        </button>
      )}
      {authStatus === "authenticated" && (
        <CreateCommentForm
          parentCommentId={null}
          postId={post.id}
          setCurrentParentCommentId={setCurrentParentCommentId}
        />
      )}
      <Loading size="large" show={isLoadingComments} />

      {comments && comments.length > 0 && (
        <PostComments
          comments={comments}
          postId={post.id}
          openCreateCommentId={openCreateCommentId}
          setOpenCreateCommentId={setOpenCreateCommentId}
          setCurrentParentCommentId={setCurrentParentCommentId}
        />
      )}
    </div>
  );
};

export type UIComment = {
  id: string;
  createdAt: Date;
  user: User;
  content: string;
  postId: string;
  _count: {
    childComments: number;
    votes: number;
  };
  childComments?: UIComment[];
  votes: CommentVote[];
};

const PostComments: React.FC<{
  postId: string;
  comments: UIComment[];
  openCreateCommentId: string | null;
  setOpenCreateCommentId: (x: string | null) => void;
  setCurrentParentCommentId: (x: string | null) => void;
}> = ({
  postId,
  comments,
  openCreateCommentId,
  setOpenCreateCommentId,
  setCurrentParentCommentId,
}) => {
  const { status: authStatus } = useSession();
  const [closedComments, setClosedComments] = useState<Set<string>>(new Set());

  function closeOrOpenComment(commentId: string) {
    return () => {
      if (closedComments.has(commentId)) {
        closedComments.delete(commentId);
      } else {
        closedComments.add(commentId);
      }
      setClosedComments((prev) => new Set(prev));
    };
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded bg-zinc-800 pr-1 pl-1 pt-2 md:max-w-5xl">
      {comments.map((comment) => {
        return (
          <div key={comment.id} className="flex">
            <button
              className="mt-2 w-1 cursor-pointer rounded-full bg-zinc-600 hover:bg-zinc-200"
              onClick={closeOrOpenComment(comment.id)}
            ></button>
            <div
              className={cx(
                "mt-2 w-full overflow-hidden rounded-sm pl-2 pt-1 transition-colors duration-300",
                closedComments.has(comment.id) &&
                  "h-12 cursor-pointer bg-zinc-900"
              )}
              onClick={
                closedComments.has(comment.id)
                  ? () =>
                      setClosedComments((prev) => {
                        const x = new Set(prev);
                        x.delete(comment.id);
                        return x;
                      })
                  : undefined
              }
            >
              <div className="mb-1 flex items-center gap-0.5 text-xs text-gray-400">
                <Link
                  className="group flex items-center hover:underline"
                  href="/"
                >
                  <div className="h-10 w-10">
                    {comment.user.image ? (
                      <Image
                        className="rounded-[50%] p-1 transition-all group-hover:rounded-lg"
                        loader={({ src }) => src}
                        src={comment.user.image}
                        alt={`Profile image of ${comment.user.name}`}
                        width="128"
                        height="128"
                      />
                    ) : (
                      comment.user.name?.charAt(0).toUpperCase() ?? ""
                    )}
                  </div>
                  {/* TODO: user profile */}
                  u/{comment.user.name}
                </Link>
                <BsDot />
                {timeAgo(comment.createdAt)}
              </div>
              {!closedComments.has(comment.id) && (
                <div className="w-full">
                  <div className="ml-8">
                    <Markdown source={comment.content} />
                  </div>
                  <div className="ml-8 flex gap-8 md:gap-12">
                    <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-emerald-400">
                      <BsShare className="text-xl" />
                      Share
                    </button>
                    <CommentLikeButton
                      comment={comment}
                      loggedIn={authStatus === "authenticated"}
                    />
                    <LoggedOnlyButton
                      Child={(props) => (
                        <button
                          {...props}
                          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-blue-500"
                        >
                          <BsChatLeft className="text-xl" />
                          Reply
                        </button>
                      )}
                      onClick={() => {
                        setOpenCreateCommentId(
                          openCreateCommentId === comment.id ? null : comment.id
                        );
                      }}
                      icon={<BsChatLeft className="text-blue-500" />}
                      title={
                        <>
                          Reply to{" "}
                          <Link href="/" className="font-bold hover:underline">
                            {comment.user.name}
                          </Link>
                          &apos;s appreciable comment
                        </>
                      }
                      content="Join Bessit to share your thoughts with our incredible community"
                    />
                  </div>
                  {authStatus === "authenticated" && (
                    <div
                      className={cx(
                        "w-full transition-all",
                        openCreateCommentId === comment.id
                          ? "min-h-[9rem]"
                          : "min-h-0"
                      )}
                    >
                      {openCreateCommentId === comment.id && (
                        <CreateCommentForm
                          parentCommentId={openCreateCommentId}
                          postId={postId}
                          setCurrentParentCommentId={setCurrentParentCommentId}
                        />
                      )}
                    </div>
                  )}

                  {comment.childComments && comment.childComments.length > 0 ? (
                    <PostComments
                      postId={postId}
                      comments={comment.childComments}
                      openCreateCommentId={openCreateCommentId}
                      setOpenCreateCommentId={setOpenCreateCommentId}
                      setCurrentParentCommentId={setCurrentParentCommentId}
                    />
                  ) : (
                    comment._count.childComments > 0 && (
                      <button
                        className="ml-4 text-indigo-400 hover:underline"
                        onClick={() => setCurrentParentCommentId(comment.id)}
                      >
                        {comment._count.childComments} more replies
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const createCommentSchema = z.object({
  content: z
    .string()
    .min(4, { message: "Comment must be at least 4 characters long" })
    .max(4096, { message: "Comment must be at most 4096 characters long" }),
});
type createCommentForm = z.infer<typeof createCommentSchema>;

const CreateCommentForm: React.FC<{
  postId: string;
  parentCommentId: string | null;
  setCurrentParentCommentId: (x: string | null) => void;
}> = ({ postId, parentCommentId, setCurrentParentCommentId }) => {
  const { control, handleSubmit, reset } = useForm<createCommentForm>({
    mode: "onSubmit",
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: "",
    },
  });
  const utils = trpc.useContext();
  const createCommentMutation = trpc.post.createComment.useMutation({
    onSuccess: (data) => {
      setCurrentParentCommentId(data.id);
      utils.post.getComments.invalidate();
      reset({ content: "" });
    },
  });
  const onSubmit = (data: createCommentForm) => {
    createCommentMutation.mutate({
      postId,
      content: data.content,
      parentCommentId,
    });
  };

  return (
    <div
      className={cx(
        "mx-auto w-full max-w-3xl rounded bg-zinc-800 md:max-w-5xl",
        parentCommentId === null ? "my-2 p-3" : "grow-on-mount"
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <>
              <div
                className={cx(
                  "overflow-hidden text-red-400 transition-all",
                  fieldState.isDirty && fieldState.error?.message
                    ? "h-8"
                    : "h-0"
                )}
              >
                {fieldState.isDirty && fieldState.error?.message}
              </div>
              <textarea
                autoComplete="off"
                {...field}
                className={cx(
                  "max-h-[50vh] min-h-[5rem] w-full overflow-y-scroll rounded border-2 bg-transparent p-1 text-zinc-200 outline-none disabled:contrast-50",
                  fieldState.isDirty && fieldState.error
                    ? "border-red-600"
                    : "border-zinc-500 focus:border-zinc-300"
                )}
                placeholder="Your nice, helpful and engaging comment"
                disabled={createCommentMutation.isLoading}
              ></textarea>
            </>
          )}
        />
        <div className="ml-auto flex w-32 justify-end">
          <Loading show={createCommentMutation.isLoading} size="small" />
          <button
            disabled={createCommentMutation.isLoading}
            type="submit"
            className="my-2 w-24 rounded-md bg-indigo-800 p-2 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

const postDataQuerySchema = z.object({
  community_name: z.string(),
  post_data: z.array(z.string()).min(2).max(3),
  cached_post: z.string().optional(),
});
const useCachedPost = (topElement: HTMLElement | null) => {
  const router = useRouter();
  const zodParsing = postDataQuerySchema.safeParse(router.query);
  const queryData = zodParsing.success ? zodParsing.data : undefined;

  const postQuery = trpc.post.getPost.useQuery(
    { post_id: queryData?.post_data[0] ?? "NOT_SENDABLE" },
    {
      initialData:
        queryData && queryData.cached_post
          ? (superjson.parse(queryData.cached_post) as Post & {
              user: User;
              community: Community;
            })
          : undefined,
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  const commentsQuery = trpc.post.getComments.useInfiniteQuery(
    {
      post: queryData?.post_data[0] ?? "NOT_SENDABLE",
      count: 12,
      mainCommentId: queryData?.post_data[2] ?? null,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
      notifyOnChangeProps: "all",
      keepPreviousData: true,
    }
  );

  const flattenedComments = useMemo(() => {
    return (
      commentsQuery.data?.pages.reduce<
        typeof commentsQuery["data"]["pages"][number]["comments"]
      >((acc, cur) => {
        acc.push(...cur.comments);
        return acc;
      }, []) || []
    );
  }, [commentsQuery]);

  useEffect(() => {
    const listener = () => {
      if (
        commentsQuery.isLoading ||
        commentsQuery.isFetchingNextPage ||
        !commentsQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 800 >
        document.body.offsetHeight
      ) {
        commentsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [commentsQuery]);

  return {
    is404: postQuery.status === "success" && !postQuery.data,
    post: postQuery.data,
    comments: flattenedComments,
    isLoading: {
      post: postQuery.isFetching || postQuery.isLoading,
      comments: commentsQuery.isLoading || commentsQuery.isFetching,
    },
    currentMainCommentId: queryData?.post_data[2] ?? null,
    setCurrentMainCommentId: (commentId: string | null) => {
      if (!queryData?.post_data) return;
      const copyPostData = [...queryData.post_data];
      if (commentId === null && copyPostData.length === 3) {
        copyPostData.pop();
      } else {
        copyPostData[2] = commentId as string;
      }
      topElement?.scrollIntoView({ behavior: "smooth", block: "end" });
      router.push(
        { query: { ...router.query, post_data: copyPostData } },
        postQuery.data
          ? `/b/${postQuery.data.community.name}/post/${
              postQuery.data.id
            }/${slugify(postQuery.data.title)}/${commentId ?? ""}`
          : undefined,
        { shallow: true }
      );
    },
  };
};
