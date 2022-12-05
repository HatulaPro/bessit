import { BsSuitHeart, BsSuitHeartFill } from "react-icons/bs";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { trpc } from "../utils/trpc";
import { Loading } from "./Loading";

export const LikeButton: React.FC<{
  post: CommunityPosts["posts"][number];
  communityQueryInput?: CommunityPosts["input"];
}> = ({ post, communityQueryInput }) => {
  const utils = trpc.useContext();
  const voted = post.votes.length > 0;
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
      if (communityQueryInput) {
        const cacheData =
          utils.post.getPosts.getInfiniteData(communityQueryInput);
        if (cacheData) {
          cacheData.pages = cacheData.pages.map((page) => {
            let needsChange = false;
            const nextPosts = page.posts.map((pagePost) => {
              if (pagePost.id === post.id) {
                needsChange = true;
                return {
                  ...pagePost,
                  votes: voted ? [] : [data],
                  _count: { votes: pagePost._count.votes + (voted ? -1 : 1) },
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

          utils.post.getPosts.setInfiniteData(communityQueryInput, {
            ...cacheData,
          });
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
