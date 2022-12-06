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

const PostPage: NextPage = () => {
  const { post, isLoading, is404 } = useCachedPost();
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
        {isLoading && <Loading show size="large" />}
        {is404 && (
          <NotFoundMessage message="This post does not seem to exist" />
        )}
        {post && <PostPageContent post={post} />}

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
}> = ({ post }) => {
  return (
    <div className="w-full">
      <SinglePost post={post} isMain={true} />
      <PostComments postId={post.id} />
    </div>
  );
};

const PostComments: React.FC<{ postId: string }> = ({ postId }) => {
  const commentsQuery = trpc.post.getComments.useInfiniteQuery(
    { post: postId ?? "NOT_SENDABLE", count: 12, sort: "new" },
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  if (
    commentsQuery.isLoading ||
    commentsQuery.isFetching ||
    !commentsQuery.data
  ) {
    return <Loading show size="large" />;
  }

  // const flattenedPages = useMemo(() => {
  //   commentsQuery.data.pages.map((page) => {
  //     page.map((comment) => {
  //       comment.
  //     })
  //   })
  // }, commentsQuery.data)

  return (
    <div>
      {commentsQuery.data.pages.map((page) =>
        page.comments.map((com) => <div key={com.id}>{com.content}</div>)
      )}
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

  return {
    is404: postQuery.status === "success" && !postQuery.data,
    post: postQuery.data,
    isLoading: postQuery.isFetching || postQuery.isLoading,
  };
};
