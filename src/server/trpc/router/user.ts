import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ userId: z.string().length(25) }))
    .query(async ({ ctx, input }) => {
      const [postVotes, commentVotes, user] = await ctx.prisma.$transaction([
        ctx.prisma.postVote.count({
          where: { post: { userId: input.userId } },
        }),
        ctx.prisma.postVote.count({
          where: { post: { userId: input.userId } },
        }),

        ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            name: true,
            image: true,
            isGlobalMod: true,
            bannedUntil: true,
            _count: {
              select: {
                sessions: true,
                comment: true,
                posts: true,
              },
            },
            ban: true,
          },
        }),
      ]);

      if (!user) return null;
      return {
        user: user,
        postVotes: Math.max(0, postVotes + Math.round(Math.random() * 8 - 4)),
        commentVotes: Math.max(
          0,
          commentVotes + Math.round(Math.random() * 8 - 4)
        ),
      };
    }),
  getUserPosts: publicProcedure
    .input(
      z.object({
        userId: z.string().length(25),
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: input.count + 1,
        where: { userId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: { community: true },
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

  getUserComments: publicProcedure
    .input(
      z.object({
        userId: z.string().length(25),
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: input.count + 1,
        where: { userId: input.userId },
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: { post: { include: { community: true } } },
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
});
