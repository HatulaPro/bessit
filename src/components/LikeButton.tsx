import { BsSuitHeart, BsSuitHeartFill } from "react-icons/bs";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { trpc } from "../utils/trpc";

export const LikeButton: React.FC<{
  post: CommunityPosts["posts"][number];
}> = ({ post }) => {
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

      //   utils.post.getPosts.
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
      className="p-2 text-lg text-red-400 hover:bg-zinc-700 disabled:text-zinc-300"
      disabled={likeMutation.isLoading}
    >
      {voted ? <BsSuitHeartFill /> : <BsSuitHeart />}
      {post._count.votes}
    </button>
  );
};
