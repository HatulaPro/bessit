import type { Community, Post, User } from "@prisma/client";
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
import { cx, timeAgo } from "../../../../utils/general";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BsDot, BsChatLeft, BsShare } from "react-icons/bs";
import Image from "next/image";
import { Markdown } from "../../../../components/Markdown";

const PostPage: NextPage = () => {
  const { post, isLoading, is404, comments } = useCachedPost();
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
      <main className="relative flex min-h-full w-full flex-col items-center bg-zinc-900 pb-2 text-white">
        {isLoading.post && <Loading show size="large" />}
        {is404 && (
          <NotFoundMessage message="This post does not seem to exist" />
        )}
        {post && <PostPageContent comments={comments} post={post} />}

        <button
          onClick={() => {
            router.back();
          }}
          className="absolute right-12 top-12 hidden items-center gap-1 rounded-xl px-2 py-1 text-white hover:bg-white hover:bg-opacity-10 md:flex"
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
}> = ({ post, comments }) => {
  const { status: authStatus } = useSession();
  const [openCreateCommentId, setOpenCreateCommentId] = useState<string | null>(
    null
  );

  return (
    <div className="w-full">
      <SinglePost post={post} isMain={true} />
      {authStatus === "authenticated" && (
        <CreateCommentForm parentCommentId={null} postId={post.id} />
      )}

      <PostComments
        comments={comments}
        postId={post.id}
        openCreateCommentId={openCreateCommentId}
        setOpenCreateCommentId={setOpenCreateCommentId}
      />
    </div>
  );
};

type UIComment = {
  id: string;
  createdAt: Date;
  user: User;
  content: string;
  childComments?: UIComment[];
};

const PostComments: React.FC<{
  postId: string;
  comments: UIComment[];
  openCreateCommentId: string | null;
  setOpenCreateCommentId: (x: string | null) => void;
}> = ({ postId, comments, openCreateCommentId, setOpenCreateCommentId }) => {
  const { status: authStatus } = useSession();
  return (
    <div className="mx-auto w-full max-w-3xl rounded bg-zinc-800 p-2 md:max-w-5xl">
      {comments ? (
        comments.map((comment) => {
          return (
            <div
              key={comment.id}
              className="mt-2 rounded-sm border-l-4 border-zinc-600 p-3"
            >
              <div className="mb-2 flex items-center gap-0.5 text-xs text-gray-400">
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
              <div className="ml-8">
                <Markdown source={comment.content} />
              </div>
              <hr className="my-1.5 opacity-50" />
              <div className="mx-auto flex max-w-sm justify-evenly">
                <button className="text-md m-2 hover:text-zinc-400">
                  <BsShare />
                </button>
                {authStatus === "authenticated" && (
                  <button
                    className="text-md m-2 hover:text-zinc-400"
                    onClick={() => {
                      setOpenCreateCommentId(
                        openCreateCommentId === comment.id ? null : comment.id
                      );
                    }}
                  >
                    <BsChatLeft />
                  </button>
                )}
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
                    />
                  )}
                </div>
              )}

              {comment.childComments && comment.childComments.length > 0 && (
                <PostComments
                  postId={postId}
                  comments={comment.childComments}
                  openCreateCommentId={openCreateCommentId}
                  setOpenCreateCommentId={setOpenCreateCommentId}
                />
              )}
            </div>
          );
        })
      ) : (
        <Loading show size="large" />
      )}
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
}> = ({ postId, parentCommentId }) => {
  const { control, handleSubmit, reset } = useForm<createCommentForm>({
    mode: "onSubmit",
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: "",
    },
  });

  const createCommentMutation = trpc.post.createComment.useMutation({
    onSuccess: (data) => {
      // TODO: acually show the comment
      console.log(data);
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
    <div className="grow-on-mount mx-auto w-full max-w-3xl rounded bg-zinc-800 p-2 md:max-w-5xl">
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
  post_data: z.array(z.string()).length(2),
  cached_post: z.string().optional(),
});
const useCachedPost = () => {
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
    { post: queryData?.post_data[0] ?? "NOT_SENDABLE", count: 12, sort: "new" },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
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
        window.innerHeight + window.scrollY + 200 >
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
  };
};
