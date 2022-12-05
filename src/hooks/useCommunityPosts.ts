import type { Community, Post, PostVote, User } from "@prisma/client";
import { useEffect, useMemo } from "react";
import { trpc } from "../utils/trpc";
import type { RouterInputs } from "../utils/trpc";

export type CommunityPosts = ReturnType<typeof useCommunityPosts>;

export function useCommunityPosts(communityName: string | null) {
  const input: RouterInputs["post"]["getPosts"] = {
    community: communityName ?? null,
    count: 12,
    sort: "new",
  };
  const getPostsQuery = trpc.post.getPosts.useInfiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 0,
    notifyOnChangeProps: "all",
  });

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
    return (
      getPostsQuery.data?.pages.reduce<
        (Post & {
          user: User;
          community: Community;
          votes: PostVote[];
          _count: {
            votes: number;
          };
        })[]
      >((acc, cur) => {
        acc.push(...cur.posts);
        return acc;
      }, []) || []
    );
  }, [getPostsQuery]);

  return {
    posts: flattenedPosts,
    isLoading: getPostsQuery.isLoading || getPostsQuery.isFetching,
    community: communityName ? flattenedPosts[0]?.community : null,
    input,
  };
}
