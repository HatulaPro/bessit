import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ userId: z.string().length(25) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.user
        .findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            name: true,
            image: true,
            _count: {
              select: {
                postVotes: true,
                commentVotes: true,
                sessions: true,
                comment: true,
                posts: true,
              },
            },
          },
        })
        .then((result) => {
          if (result) {
            // Random changes to score cuz funny
            result._count.commentVotes += Math.round(Math.random() * 8 - 4);
            result._count.commentVotes = Math.max(
              result._count.commentVotes,
              0
            );
            result._count.postVotes += Math.round(Math.random() * 8 - 4);
            result._count.postVotes = Math.max(result._count.postVotes, 0);
          }
          return result;
        });
    }),
});
