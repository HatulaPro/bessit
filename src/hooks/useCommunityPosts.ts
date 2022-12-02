import type { Community, Post, User } from "@prisma/client";
import { useEffect, useMemo } from "react";
import { trpc } from "../utils/trpc";

export type CommunityPosts = ReturnType<typeof useCommunityPosts>;

export function useCommunityPosts(communityName: string | null) {
  const getPostsQuery = trpc.post.getPosts.useInfiniteQuery(
    {
      community: communityName ?? null,
      count: 12,
      sort: "new",
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: 0,
    }
  );

  useEffect(() => {
    const listener = () => {
      if (
        getPostsQuery.isLoading ||
        getPostsQuery.isFetchingNextPage ||
        !getPostsQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 200 >
        document.body.offsetHeight
      ) {
        getPostsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [getPostsQuery]);
  const flattenedPosts = useMemo(() => {
    const posts: (Post & {
      user: User;
      community: Community;
    })[] = [];
    if (!getPostsQuery.data) return posts;
    for (const page of getPostsQuery.data.pages) {
      posts.push(...page.posts);
    }
    return posts;
  }, [getPostsQuery.data]);

  return {
    posts: flattenedPosts,
    isLoading: getPostsQuery.isLoading || getPostsQuery.isFetching,
    community: communityName ? flattenedPosts[0]?.community : null,
  };
}
