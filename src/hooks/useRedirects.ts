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

type CommunityType = Partial<RouterOutputs["community"]["getCommunity"]>;
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
}) satisfies z.ZodType<CommunityType>;

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
    if (process.env.NODE_ENV === "production") return {};
    throw new Error("Can not parse community info.");
  }, [router?.query?.cached_community]);

  return cached_community;
}

type PostType = Partial<RouterOutputs["post"]["getPost"]>;
const PostSchema = z.object({
  user: z
    .object({
      bannedUntil: z.date(),
      name: z.string().nullable(),
      image: z.string().nullable(),
      id: z.string(),
      isGlobalMod: z.boolean(),
    })
    .optional(),
  community: z
    .object({
      desc: z.string(),
      id: z.string(),
      name: z.string(),
      ownerId: z.string(),
      image: z.string().nullable(),
      logo: z.string().nullable(),
      rules: z.array(z.string()),
      moderators: z.array(
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
      ),
    })
    .optional(),
  _count: z
    .object({
      votes: z.number(),
      comments: z.number(),
    })
    .optional(),
  communityName: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  id: z.string().optional(),
  userId: z.string().optional(),
  isDeleted: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  votes: z
    .array(z.object({ postId: z.string(), userId: z.string() }))
    .optional(),
}) satisfies z.ZodType<PostType>;

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

export function usePostFromQuery() {
  const router = useRouter();

  const cached_post = useMemo(() => {
    if (typeof router?.query?.cached_post !== "string") return {};
    const parsed = superjson.parse(router.query.cached_post as string) || {};
    const result = PostSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    if (process.env.NODE_ENV === "production") return {};
    throw new Error("Can not parse post info.");
  }, [router?.query?.cached_post]);

  return cached_post;
}
