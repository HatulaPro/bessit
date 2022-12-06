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
import { cx } from "../../../../utils/general";
import { useSession } from "next-auth/react";

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
          onClick={() => router.back()}
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
  return (
    <div className="w-full">
      <SinglePost post={post} isMain={true} />
      <PostComments comments={comments} postId={post.id} />
    </div>
  );
};

const PostComments: React.FC<{
  postId: string;
  comments: ReturnType<typeof useCachedPost>["comments"];
}> = ({ postId, comments }) => {
  const { status: authStatus } = useSession();
  return (
    <div>
      {authStatus === "authenticated" && <CreateCommentForm postId={postId} />}

      {comments ? (
        comments.pages.map((page) =>
          page.comments.map((com) => <div key={com.id}>{com.content}</div>)
        )
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

const CreateCommentForm: React.FC<{ postId: string }> = ({ postId }) => {
  const { control, handleSubmit, reset } = useForm<createCommentForm>({
    mode: "onTouched",
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
    createCommentMutation.mutate({ postId, content: data.content });
  };

  return (
    <div className="mx-auto w-full max-w-3xl rounded bg-zinc-800 p-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="content"
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
              <textarea
                autoComplete="off"
                {...field}
                className={cx(
                  "max-h-[50vh] min-h-[5rem] w-full overflow-y-scroll rounded border-2 bg-transparent p-1 text-zinc-200 outline-none disabled:contrast-50",
                  fieldState.error
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
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  return {
    is404: postQuery.status === "success" && !postQuery.data,
    post: postQuery.data,
    comments: commentsQuery.data,
    isLoading: {
      post: postQuery.isFetching || postQuery.isLoading,
      comments: commentsQuery.isLoading || commentsQuery.isFetching,
    },
  };
};
