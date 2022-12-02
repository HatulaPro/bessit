import { useEffect } from "react";
import { trpc } from "../utils/trpc";

export const PostsViewer: React.FC<{ communityName: string | null }> = ({
  communityName,
}) => {
  const getPostsQuery = trpc.post.getPosts.useInfiniteQuery(
    {
      community: communityName,
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
        console.log("load new");
        getPostsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [getPostsQuery]);

  return (
    <div>
      {getPostsQuery.data?.pages.map((page) =>
        page.posts.map((post) => <div key={post.id}>{post.title}</div>)
      )}
    </div>
  );
};
