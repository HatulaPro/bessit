import { slugify } from "./../utils/general";
import superjson from "superjson";
import { useRouter } from "next/router";
import type { RouterOutputs } from "../utils/trpc";
import type { CommunityPosts } from "./useCommunityPosts";

export function useCommunityRedirect() {
  const router = useRouter();

  return (
    community: Partial<RouterOutputs["community"]["getCommunity"]> & {
      name: string;
    }
  ) => {
    router.push(
      {
        pathname: `/b/${community.name}`,
        query: { cached_community: superjson.stringify(community) },
      },
      `/b/${community.name}`,
      { shallow: true }
    );
  };
}

export function usePostRedirect() {
  const router = useRouter();

  return (
    post: Partial<CommunityPosts["posts"][number]> & {
      community: { name: string };
      id: string;
      title: string;
    },
    commentId?: string
  ) => {
    const link = `/b/${post.community.name}/post/${post.id}/${slugify(
      post.title
    )}${commentId ? "/" + commentId : ""}`;
    router.push(
      {
        pathname: link,
        query: { cached_post: superjson.stringify(post) },
      },
      link,
      { shallow: true }
    );
  };
}
