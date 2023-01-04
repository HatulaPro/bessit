import {
  GET_COMMUNITY_PLACEHOLDER,
  GET_POSTS_PLACEHOLDER,
} from "./../utils/placeholders";
import { useEffect, useMemo } from "react";
import { trpc } from "../utils/trpc";
import type { RouterInputs } from "../utils/trpc";
import { useCommunityFromQuery } from "./useRedirects";

export type CommunityPosts = ReturnType<typeof useCommunityPosts>;

export function useCommunityPosts(
  communityName: string | null,
  sort: RouterInputs["post"]["getPosts"]["sort"],
  postsFromLast: RouterInputs["post"]["getPosts"]["postsFromLast"]
) {
  const input: RouterInputs["post"]["getPosts"] = {
    community: communityName ?? null,
    count: 25,
    sort,
    postsFromLast: postsFromLast,
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
    placeholderData: GET_POSTS_PLACEHOLDER,
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

  const cached_community = useCommunityFromQuery();
  const communityQueryEnabled = Boolean(input.community);
  const getCommunityQuery = trpc.community.getCommunity.useQuery(
    { name: input.community ?? "NOT_SENDABLE" },
    {
      enabled: communityQueryEnabled,
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: 0,
      placeholderData: {
        ...GET_COMMUNITY_PLACEHOLDER,
        name: communityName ?? GET_COMMUNITY_PLACEHOLDER.name,
        ...cached_community,
      },
    }
  );

  return {
    posts: flattenedPosts,
    isLoading:
      getPostsQuery.isLoading ||
      getPostsQuery.isFetching ||
      (communityQueryEnabled &&
        (getCommunityQuery.isLoading || getCommunityQuery.isFetching)),
    community: getCommunityQuery.data || null,
  };
}
