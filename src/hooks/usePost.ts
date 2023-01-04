import { useEffect } from "react";
import {
  GET_COMMENTS_PLACEHOLDER,
  GET_POST_PLACEHOLDER,
} from "./../utils/placeholders";
import { useRouter } from "next/router";
import { z } from "zod";
import { trpc } from "../utils/trpc";
import { useMemo } from "react";
import { slugify } from "../utils/general";
import { usePostFromQuery } from "./useRedirects";

const postDataQuerySchema = z.object({
  community_name: z.string(),
  post_data: z.array(z.string()).min(2).max(3),
  cached_post: z.string().optional(),
});
export const usePost = (topElement: HTMLElement | null) => {
  const router = useRouter();
  const zodParsing = postDataQuerySchema.safeParse(router.query);
  const queryData = zodParsing.success ? zodParsing.data : undefined;
  const initialPlaceholderFromCache = usePostFromQuery();

  const postQuery = trpc.post.getPost.useQuery(
    { post_id: queryData?.post_data[0] ?? "NOT_SENDABLE" },
    {
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
      placeholderData: {
        ...GET_POST_PLACEHOLDER,
        ...initialPlaceholderFromCache,
      },
    }
  );

  const commentsQuery = trpc.post.getComments.useInfiniteQuery(
    {
      post: queryData?.post_data[0] ?? "NOT_SENDABLE",
      count: 25,
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
      placeholderData: GET_COMMENTS_PLACEHOLDER,
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
        window.innerHeight + window.scrollY + 1200 >
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
