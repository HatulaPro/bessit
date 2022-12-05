import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { BsSuitHeart, BsSuitHeartFill } from "react-icons/bs";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { trpc } from "../utils/trpc";
import type { RouterOutputs, RouterInputs } from "../utils/trpc";
import { Loading } from "./Loading";

type InfinityQueryKeyInput<T> = {
  input: T;
  type: "infinite";
};

export const LikeButton: React.FC<{
  post: CommunityPosts["posts"][number];
  communityQueryInput?: CommunityPosts["input"];
}> = ({ post, communityQueryInput }) => {
  const utils = trpc.useContext();
  const voted = post.votes.length > 0;
  const queryClient = useQueryClient();
  const likeMutation = trpc.post.likePost.useMutation({
    cacheTime: 0,
    onSuccess: (data) => {
      const singlePostData = utils.post.getPost.getData({ post_id: post.id });
      if (singlePostData) {
        utils.post.getPost.setData(
          { post_id: post.id },
          {
            ...singlePostData,
            votes: voted ? [] : [data],
            _count: { votes: singlePostData._count.votes + (voted ? -1 : 1) },
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
    },
  });
  return (
    <button
      onClick={() =>
        likeMutation.mutate({
          postId: post.id,
          action: voted ? "unlike" : "like",
        })
      }
      className="flex items-center gap-2 p-2 text-lg text-red-400 transition-colors hover:bg-zinc-700 disabled:text-zinc-300"
      disabled={likeMutation.isLoading}
    >
      {likeMutation.isLoading ? (
        <Loading show size="small" />
      ) : voted ? (
        <BsSuitHeartFill />
      ) : (
        <BsSuitHeart />
      )}
      {post._count.votes}
    </button>
  );
};
