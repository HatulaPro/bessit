import { useMemo } from "react";
import { slugify } from "./../utils/general";
import superjson from "superjson";
import { useRouter } from "next/router";
import type { RouterOutputs } from "../utils/trpc";
import type { CommunityPosts } from "./useCommunityPosts";
import { z } from "zod";

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

type Temp = Partial<RouterOutputs["community"]["getCommunity"]>;
const CommunitySchema = z.object({
  members: z
    .array(
      z.object({
        communityId: z.string(),
        userId: z.string(),
      })
    )
    .optional(),
  _count: z.object({ members: z.number() }).optional(),
  desc: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  ownerId: z.string().optional(),
  image: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  rules: z.array(z.string()).optional(),
  moderators: z
    .array(
      z.object({
        communityId: z.string(),
        userId: z.string(),
        user: z.object({
          bannedUntil: z.date(),
          name: z.string().nullable(),
          image: z.string().nullable(),
          id: z.string(),
          isGlobalMod: z.boolean(),
        }),
      })
    )
    .optional(),
}) satisfies z.ZodType<Temp>;

export function useCommunityFromQuery() {
  const router = useRouter();

  const cached_community = useMemo(() => {
    if (typeof router?.query?.cached_community !== "string") return {};
    const parsed =
      superjson.parse(router.query.cached_community as string) || {};
    const result = CommunitySchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    // throw new Error("Can not parse community info.");
    return {};
  }, [router?.query?.cached_community]);

  return cached_community;
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
