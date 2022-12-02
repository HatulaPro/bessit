import type { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createPostSchema } from "../../../components/PostEditor";
import { router, protectedProcedure, publicProcedure } from "../trpc";

export const postsRouter = router({
  createPost: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const community = await ctx.prisma.community.findUnique({
        where: { name: input.communityName },
        select: { id: true },
      });
      if (!community) {
        throw new TRPCError({
          message: "Community not found.",
          code: "BAD_REQUEST",
        });
      }
      const newPost = await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          isDeleted: false,
          userId: userId,
          communityId: community.id,
        },
      });
      return newPost;
    }),
  getPosts: publicProcedure
    .input(
      z.object({
        sort: z.enum(["new"]),
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
        community: z.string().min(4).max(24).nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      let whereQuery: Partial<Post> = { isDeleted: false };
      if (input.community) {
        const community = await ctx.prisma.community.findUnique({
          where: { name: input.community },
          select: { id: true },
        });
        if (!community) {
          throw new TRPCError({
            message: "Community not found.",
            code: "BAD_REQUEST",
          });
        }
        whereQuery = { communityId: community.id, isDeleted: false };
      }
      const posts = await ctx.prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: input.count + 1,
        where: whereQuery,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: { community: true, user: true },
      });
      if (posts.length < input.count) {
        return {
          posts,
          nextCursor: undefined,
        };
      }
      const nextCursor = posts.length > 0 ? posts.pop()?.id : undefined;
      return {
        posts,
        nextCursor,
      };
    }),
});
