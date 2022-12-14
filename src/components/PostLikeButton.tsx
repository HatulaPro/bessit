import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { BsSuitHeart, BsSuitHeartFill } from "react-icons/bs";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { trpc } from "../utils/trpc";
import type { RouterOutputs, RouterInputs } from "../utils/trpc";
import { cx } from "../utils/general";
import { LoggedOnlyButton } from "./LoggedOnlyButton";
import { UserProfileLink } from "./UserProfileLink";

export type InfinityQueryKeyInput<T> = {
  input: T;
  type: "infinite";
};

export const PostLikeButton: React.FC<{
  post: CommunityPosts["posts"][number];
  userId?: string;
}> = ({ post, userId }) => {
  const utils = trpc.useContext();
  const voted = userId && post.votes.length > 0;
  const queryClient = useQueryClient();

  function setPostAs(postId: string, userId: string) {
    const data = { postId, userId };
    const singlePostData = utils.post.getPost.getData({ post_id: post.id });
    if (singlePostData) {
      utils.post.getPost.setData(
        { post_id: post.id },
        {
          ...singlePostData,
          votes: voted ? [] : [data],
          _count: {
            ...singlePostData._count,
            votes: singlePostData._count.votes + (voted ? -1 : 1),
          },
        }
      );
    }

    // Getting all the keys
    const communityQueries = queryClient.getQueriesData<
      InfiniteData<RouterOutputs["post"]["getPosts"]>
    >([["post", "getPosts"]]);

    // For every key
    for (const [queryKey, queryData] of communityQueries) {
      const queryKeyTyped = queryKey[1] as unknown as InfinityQueryKeyInput<
        RouterInputs["post"]["getPosts"]
      >;

      // queryData exists, and the community can "hold" the post
      if (
        queryData &&
        (queryKeyTyped.input.community === null ||
          queryKeyTyped.input.community === post.community.name)
      ) {
        queryData.pages = queryData.pages.map((page) => {
          let needsChange = false;
          const nextPosts = page.posts.map((pagePost) => {
            if (pagePost.id === post.id) {
              needsChange = true;
              return {
                ...pagePost,
                votes: voted ? [] : [data],
                _count: {
                  ...pagePost._count,
                  votes: pagePost._count.votes + (voted ? -1 : 1),
                },
              };
            }
            return pagePost;
          });
          if (needsChange) {
            return {
              ...page,
              posts: nextPosts,
            };
          }
          return page;
        });
        queryClient.setQueryData<
          InfiniteData<RouterOutputs["post"]["getPosts"]>
        >([["post", "getPosts"], queryKeyTyped], { ...queryData });
      }
    }
  }
  const likeMutation = trpc.post.likePost.useMutation({
    onMutate: (x) => {
      setPostAs(x.postId, userId ?? "UNREACHABLE");
    },
  });
  return (
    <LoggedOnlyButton
      Child={(props) => (
        <button
          {...props}
          className={cx(
            "group relative flex items-center gap-2 p-2 text-lg",
            voted ? "text-red-400" : "text-zinc-400",
            userId && "hover:text-red-400"
          )}
        >
          {voted ? (
            <BsSuitHeartFill className="text-2xl" />
          ) : (
            <BsSuitHeart className="text-2xl" />
          )}
          {post._count.votes}
          <div className="absolute inset-1 h-8 w-8 scale-0 rounded-full bg-red-600 bg-opacity-25 transition-all group-enabled:group-hover:scale-100"></div>
        </button>
      )}
      onClick={() =>
        likeMutation.mutate({
          postId: post.id,
          action: voted ? "unlike" : "like",
        })
      }
      icon={<BsSuitHeartFill className="text-red-500" />}
      title={
        <>
          Like <UserProfileLink user={post.user} />
          &apos;s great post
        </>
      }
      content="Join Bessit to let the world know of your appreciation of awesome content"
    />
  );
};
