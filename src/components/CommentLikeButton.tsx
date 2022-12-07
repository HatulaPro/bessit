import type { UIComment } from "../pages/b/[community_name]/post/[...post_data]";
import { BsSuitHeart, BsSuitHeartFill } from "react-icons/bs";
import { trpc } from "../utils/trpc";
import type { RouterOutputs, RouterInputs } from "../utils/trpc";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { Loading } from "./Loading";
import type { InfinityQueryKeyInput } from "./PostLikeButton";

export const CommentLikeButton: React.FC<{ comment: UIComment }> = ({
  comment,
}) => {
  const queryClient = useQueryClient();
  const voted = comment.votes.length > 0;

  const likeMutation = trpc.post.likeComment.useMutation({
    cacheTime: 0,
    onSuccess: (data) => {
      // TODO: Change a shitload of stuff
      // Getting all the keys
      const commentsQueries = queryClient.getQueriesData<
        InfiniteData<RouterOutputs["post"]["getComments"]>
      >([["post", "getComments"]]);
      console.log(commentsQueries);

      for (const [queryKey, queryData] of commentsQueries) {
        const queryKeyTyped = queryKey[1] as unknown as InfinityQueryKeyInput<
          RouterInputs["post"]["getComments"]
        >;

        if (queryData && queryKeyTyped.input.post === comment.postId) {
          queryData.pages = queryData.pages.map((page) => {
            const mappingFunction = <T extends UIComment>(coms: T[]): T[] => {
              return coms.map((currentComment) => {
                if (currentComment.id === comment.id) {
                  const res = {
                    ...currentComment,
                    votes: voted ? [] : [data],
                    _count: {
                      ...currentComment._count,
                      votes: currentComment._count.votes + (voted ? -1 : 1),
                    },
                    childComments:
                      currentComment.childComments &&
                      mappingFunction(currentComment.childComments),
                  };
                  return res;
                }
                return {
                  ...currentComment,
                  childComments:
                    currentComment.childComments &&
                    mappingFunction(currentComment.childComments),
                };
              });
            };
            const nextComments = mappingFunction(page.comments);
            return {
              ...page,
              comments: nextComments,
            };
          });
          console.log(queryData);
          queryClient.setQueryData<
            InfiniteData<RouterOutputs["post"]["getComments"]>
          >([["post", "getComments"], queryKeyTyped], { ...queryData });
        }
      }
    },
  });

  return (
    <button
      disabled={likeMutation.isLoading}
      className="text-md flex items-center gap-2 p-2 text-red-400 hover:text-red-300 disabled:text-zinc-300"
      onClick={() =>
        likeMutation.mutate({
          action: voted ? "unlike" : "like",
          commentId: comment.id,
        })
      }
    >
      {likeMutation.isLoading ? (
        <Loading show size="small" />
      ) : voted ? (
        <BsSuitHeartFill className="text-lg" />
      ) : (
        <BsSuitHeart className="text-lg" />
      )}
      {comment._count.votes}
    </button>
  );
};
