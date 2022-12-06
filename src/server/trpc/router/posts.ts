import type { Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createPostSchema } from "../../../components/PostEditor";
import { router, protectedProcedure, publicProcedure } from "../trpc";

export const postsRouter = router({
  createPost: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId: string = ctx.session.user.id;
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
      return await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          isDeleted: false,
          userId: userId,
          communityId: community.id,
        },
      });
    }),
  createComment: protectedProcedure
    .input(
      z.object({
        postId: z.string().length(25),
        parentCommentId: z.string().length(25).nullable(),
        content: z.string().min(4).max(4096),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
      });
      if (!post) {
        throw new TRPCError({ message: "Post not found", code: "BAD_REQUEST" });
      }
      if (input.parentCommentId !== null) {
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: input.parentCommentId },
        });
        if (!parentComment || parentComment.postId !== input.postId) {
          throw new TRPCError({
            message: "Parent comment not found",
            code: "BAD_REQUEST",
          });
        }
      }
      return await ctx.prisma.comment.create({
        data: {
          content: input.content,
          isDeleted: false,
          parentCommentId: input.parentCommentId,
          postId: post.id,
          userId: ctx.session.user.id,
        },
      });
    }),
  getPost: publicProcedure
    .input(z.object({ post_id: z.string() }))
    .query(({ ctx, input }) => {
      // TODO: handle deletions
      return ctx.prisma.post.findUnique({
        where: { id: input.post_id },
        include: {
          community: true,
          user: true,
          _count: { select: { votes: true } },
          votes: {
            where: { userId: ctx.session?.user?.id },
            take: 1,
          },
        },
      });
    }),
  getComments: publicProcedure
    .input(
      z.object({
        sort: z.enum(["new"]),
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
        post: z.string().length(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        take: input.count,
        where: { postId: input.post, parentCommentId: null, isDeleted: false },
        // TODO: Rethink this stupid recursion thing
        select: {
          childComments: {
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
              id: true,
              user: true,
              childComments: {
                orderBy: { createdAt: "desc" },
                select: {
                  user: true,
                  content: true,
                  createdAt: true,
                  id: true,
                },
              },
            },
          },
          content: true,
          createdAt: true,
          id: true,
          user: true,
        },
      });
      if (comments.length < input.count) {
        return {
          comments,
          nextCursor: undefined,
        };
      }
      const nextCursor = comments.length > 0 ? comments.pop()?.id : undefined;
      return {
        comments,
        nextCursor,
      };
    }),
  likePost: protectedProcedure
    .input(z.object({ postId: z.string(), action: z.enum(["like", "unlike"]) }))
    .mutation(({ ctx, input }) => {
      const userId_postId = {
        postId: input.postId,
        userId: ctx.session.user.id,
      };
      if (input.action === "like") {
        return ctx.prisma.postVote.upsert({
          create: userId_postId,
          update: userId_postId,
          where: { userId_postId },
        });
      } else {
        return ctx.prisma.postVote
          .delete({ where: { userId_postId } })
          .then(() => userId_postId)
          .catch(() => userId_postId);
      }
    }),
  getPosts: publicProcedure
    .input(
      z.object({
        sort: z.enum(["new", "hot"]),
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
        orderBy:
          input.sort === "new"
            ? { createdAt: "desc" }
            : { votes: { _count: "desc" } },
        take: input.count + 1,
        where: whereQuery,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          community: true,
          user: true,
          _count: { select: { votes: true } },
          votes: {
            where: { userId: ctx.session?.user?.id },
            take: 1,
          },
        },
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
