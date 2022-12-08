import { useEffect, useMemo } from "react";
import { trpc } from "../utils/trpc";
import type { RouterInputs } from "../utils/trpc";

export type CommunityPosts = ReturnType<typeof useCommunityPosts>;

export function useCommunityPosts(
  communityName: string | null,
  sort: RouterInputs["post"]["getPosts"]["sort"]
) {
  const input: RouterInputs["post"]["getPosts"] = {
    community: communityName ?? null,
    count: 12,
    sort,
  };
  const getPostsQuery = trpc.post.getPosts.useInfiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: 0,
    notifyOnChangeProps: "all",
    keepPreviousData: true,
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
        window.innerHeight + window.scrollY + 800 >
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
        typeof getPostsQuery["data"]["pages"][number]["posts"]
      >((acc, cur) => {
        acc.push(...cur.posts);
        return acc;
      }, []) || []
    );
  }, [getPostsQuery]);

  const communityQueryEnabled =
    Boolean(input.community) &&
    flattenedPosts.length === 0 &&
    Boolean(getPostsQuery.data);
  const getCommunityQuery = trpc.community.getCommunity.useQuery(
    { name: input.community ?? "NOT_SENDABLE" },
    {
      enabled: communityQueryEnabled,
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: 0,
    }
  );
  return {
    posts: flattenedPosts,
    isLoading:
      getPostsQuery.isLoading ||
      getPostsQuery.isFetching ||
      (communityQueryEnabled &&
        (getCommunityQuery.isLoading || getCommunityQuery.isFetching)),
    community: communityName
      ? (flattenedPosts[0]?.community ?? getCommunityQuery.data) || null
      : null,
  };
}
