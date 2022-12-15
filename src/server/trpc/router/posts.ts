import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createPostSchema } from "../../../components/PostEditor";
import { router, protectedProcedure, publicProcedure } from "../trpc";

const NOTIFY_ON_NUMBERS = new Set([1, 2, 10, 100, 1000]);

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
  editPost: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2).max(256),
        content: z.string().max(4096),
        postId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
      });
      if (!post || post.userId !== userId) {
        throw new TRPCError({ message: "Post not found", code: "BAD_REQUEST" });
      }
      return await ctx.prisma.post.update({
        where: { id: post.id },
        data: { title: input.title, content: input.content },
        include: {
          community: true,
          user: true,
          _count: { select: { votes: true, comments: true } },
          votes: {
            where: { userId: ctx.session?.user?.id },
            take: 1,
          },
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
      if (!post || post.isDeleted) {
        throw new TRPCError({ message: "Post not found", code: "BAD_REQUEST" });
      }
      const parentComment =
        !!input.parentCommentId &&
        (await ctx.prisma.comment.findUnique({
          where: { id: input.parentCommentId },
        }));
      if (input.parentCommentId) {
        if (
          !parentComment ||
          parentComment.postId !== input.postId ||
          parentComment.isDeleted
        ) {
          throw new TRPCError({
            message: "Parent comment not found",
            code: "BAD_REQUEST",
          });
        }
      }
      const newComment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          isDeleted: false,
          parentCommentId: input.parentCommentId,
          postId: post.id,
          userId: ctx.session.user.id,
        },
      });

      if (parentComment) {
        // Informing the user of the parent comment of new comment
        await ctx.prisma.notification.upsert({
          where: {
            userId_type_relatedPostId: {
              type: "COMMENT_ON_COMMENT",
              userId: parentComment.userId,
              relatedPostId: newComment.postId,
            },
          },
          update: { newCommentId: newComment.id, seen: false },
          create: {
            relatedCommentId: parentComment.id,
            type: "COMMENT_ON_COMMENT",
            userId: parentComment.userId,
            newCommentId: newComment.id,
            relatedPostId: newComment.postId,
          },
        });
      } else {
        // Informing the original poster of new comment
        await ctx.prisma.notification.upsert({
          where: {
            userId_type_relatedPostId: {
              relatedPostId: post.id,
              type: "COMMENT_ON_POST",
              userId: post.userId,
            },
          },
          update: { newCommentId: newComment.id, seen: false },
          create: {
            relatedCommentId: undefined,
            type: "COMMENT_ON_POST",
            userId: post.userId,
            newCommentId: newComment.id,
            relatedPostId: post.id,
          },
        });
      }

      return newComment;
    }),
  editComment: protectedProcedure
    .input(
      z.object({
        content: z.string().min(4).max(4096),
        commentId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
      });
      if (!comment || comment.userId !== userId) {
        throw new TRPCError({
          message: "Comment not found",
          code: "BAD_REQUEST",
        });
      }
      return await ctx.prisma.comment.update({
        where: { id: comment.id },
        data: { content: input.content },
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
          _count: { select: { votes: true, comments: true } },
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
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
        mainCommentId: z.string().length(25).nullable(),
        post: z.string().length(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        take: input.count,
        where: {
          postId: input.post,
          parentCommentId: input.mainCommentId ? undefined : null,
          id: input.mainCommentId ?? undefined,
          isDeleted: false,
        },
        select: {
          childComments: {
            where: { isDeleted: false },
            orderBy: { createdAt: "desc" },
            select: {
              content: true,
              createdAt: true,
              updatedAt: true,
              postId: true,
              id: true,
              user: true,
              _count: { select: { childComments: true, votes: true } },
              votes: {
                where: { userId: ctx.session?.user?.id },
                take: 1,
              },
              childComments: {
                where: { isDeleted: false },
                orderBy: { createdAt: "desc" },
                select: {
                  user: true,
                  content: true,
                  createdAt: true,
                  updatedAt: true,
                  postId: true,
                  id: true,
                  _count: { select: { childComments: true, votes: true } },
                  votes: {
                    where: { userId: ctx.session?.user?.id },
                    take: 1,
                  },
                  childComments: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: "desc" },
                    select: {
                      user: true,
                      content: true,
                      postId: true,
                      createdAt: true,
                      updatedAt: true,
                      id: true,
                      _count: { select: { childComments: true, votes: true } },
                      votes: {
                        where: { userId: ctx.session?.user?.id },
                        take: 1,
                      },
                      childComments: {
                        where: { isDeleted: false },
                        orderBy: { createdAt: "desc" },
                        select: {
                          user: true,
                          content: true,
                          postId: true,
                          createdAt: true,
                          updatedAt: true,
                          id: true,
                          _count: {
                            select: { childComments: true, votes: true },
                          },
                          votes: {
                            where: { userId: ctx.session?.user?.id },
                            take: 1,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          content: true,
          createdAt: true,
          updatedAt: true,
          id: true,
          user: true,
          postId: true,
          _count: { select: { childComments: true, votes: true } },
          votes: {
            where: { userId: ctx.session?.user?.id },
            take: 1,
          },
        },
      });
      if (comments.length < input.count) {
        return {
          comments: comments,
          nextCursor: undefined,
        };
      }
      const nextCursor = comments.length > 0 ? comments.pop()?.id : undefined;
      return {
        comments: comments,
        nextCursor,
      };
    }),
  likePost: protectedProcedure
    .input(z.object({ postId: z.string(), action: z.enum(["like", "unlike"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId_postId = {
        postId: input.postId,
        userId: ctx.session.user.id,
      };
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: { _count: { select: { votes: true } } },
      });
      if (!post || post.isDeleted) {
        throw new TRPCError({
          message: "Post not found",
          code: "BAD_REQUEST",
        });
      }
      if (input.action === "like") {
        const votes = post._count.votes + 1;
        if (
          NOTIFY_ON_NUMBERS.has(votes) &&
          post.userId !== ctx.session.user.id
        ) {
          await ctx.prisma.notification.upsert({
            where: {
              userId_type_relatedPostId: {
                relatedPostId: post.id,
                type: "LIKES_ON_POST",
                userId: post.userId,
              },
            },
            create: {
              relatedPostId: post.id,
              type: "LIKES_ON_POST",
              userId: post.userId,
              metadata: votes,
            },
            update: {
              metadata: votes,
            },
          });
        }

        return await ctx.prisma.postVote.upsert({
          create: userId_postId,
          update: userId_postId,
          where: { userId_postId },
        });
      } else {
        return await ctx.prisma.postVote
          .delete({ where: { userId_postId } })
          .then(() => userId_postId)
          .catch(() => userId_postId);
      }
    }),
  likeComment: protectedProcedure
    .input(
      z.object({ commentId: z.string(), action: z.enum(["like", "unlike"]) })
    )
    .mutation(async ({ ctx, input }) => {
      const userId_commentId = {
        commentId: input.commentId,
        userId: ctx.session.user.id,
      };
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        include: { _count: { select: { votes: true } } },
      });
      if (!comment || comment.isDeleted) {
        throw new TRPCError({
          message: "Post not found",
          code: "BAD_REQUEST",
        });
      }
      if (input.action === "like") {
        const votes = comment._count.votes + 1;
        if (
          NOTIFY_ON_NUMBERS.has(votes) &&
          comment.userId !== ctx.session.user.id
        ) {
          await ctx.prisma.notification.upsert({
            where: {
              userId_type_relatedPostId: {
                relatedPostId: comment.postId,
                type: "LIKES_ON_COMMENT",
                userId: comment.userId,
              },
            },
            create: {
              relatedPostId: comment.postId,
              type: "LIKES_ON_COMMENT",
              userId: comment.userId,
              metadata: votes,
              relatedCommentId: comment.id,
            },
            update: {
              metadata: votes,
            },
          });
        }
        return await ctx.prisma.commentVote.upsert({
          create: userId_commentId,
          update: userId_commentId,
          where: { userId_commentId },
        });
      } else {
        return await ctx.prisma.commentVote
          .delete({ where: { userId_commentId } })
          .then(() => userId_commentId)
          .catch(() => userId_commentId);
      }
    }),
  getPosts: publicProcedure
    .input(
      z.object({
        postsFromLast: z.enum(["day", "week", "month", "year", "all time"]),
        sort: z.enum(["new", "hot", "moot"]),
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
        community: z.string().min(4).max(24).nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      let whereQuery: Parameters<typeof ctx.prisma.post.findMany>[0] = {
        where: { isDeleted: false },
      };
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
        whereQuery = { where: { communityId: community.id, isDeleted: false } };
      }

      if (input.postsFromLast === "day") {
        whereQuery.where = {
          ...whereQuery.where,
          createdAt: {
            gt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
          },
        };
      } else if (input.postsFromLast === "week") {
        whereQuery.where = {
          ...whereQuery.where,
          createdAt: {
            gt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7),
          },
        };
      } else if (input.postsFromLast === "month") {
        whereQuery.where = {
          ...whereQuery.where,
          createdAt: {
            gt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
          },
        };
      } else if (input.postsFromLast === "year") {
        whereQuery.where = {
          ...whereQuery.where,
          createdAt: {
            gt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365),
          },
        };
      }

      const orderByMap: Record<
        typeof input["sort"],
        Parameters<typeof ctx.prisma.post.findMany>[0]
      > = {
        new: { orderBy: { createdAt: "desc" } },
        hot: { orderBy: { votes: { _count: "desc" } } },
        moot: { orderBy: { comments: { _count: "desc" } } },
      } as const;

      const posts = await ctx.prisma.post.findMany({
        orderBy: orderByMap[input.sort]?.orderBy,
        take: input.count + 1,
        where: whereQuery.where,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          community: true,
          user: true,
          _count: { select: { votes: true, comments: true } },
          votes: {
            where: { userId: ctx.session?.user?.id },
            take: 1,
          },
        },
      });
      if (posts.length < input.count) {
        return {
          posts: posts,
          nextCursor: undefined,
        };
      }
      const nextCursor = posts.length > 0 ? posts.pop()?.id : undefined;
      return {
        posts: posts,
        nextCursor,
      };
    }),
});
