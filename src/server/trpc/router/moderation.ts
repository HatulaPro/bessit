import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const moderationRouter = router({
  addModerator: protectedProcedure
    .input(
      z.object({
        communityId: z.string().length(25),
        moderatorId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [community, user] = await Promise.all([
        ctx.prisma.community.findUnique({
          where: { id: input.communityId },
          include: { moderators: { include: { user: true } } },
        }),
        ctx.prisma.user.findUnique({ where: { id: input.moderatorId } }),
      ]);
      if (!community || community.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          message: "Community not found.",
          code: "BAD_REQUEST",
        });
      }
      // Can't make owner a mod
      if (!user || community.ownerId === user.id) {
        throw new TRPCError({
          message: "User not found.",
          code: "BAD_REQUEST",
        });
      }

      // If the user is already a mod do nothing
      if (new Set(community.moderators.map((mod) => mod.userId)).has(user.id)) {
        return community;
      }

      return await ctx.prisma.moderator
        .create({
          data: { communityId: input.communityId, userId: input.moderatorId },
          include: { user: true },
        })
        .then((mod) => {
          community.moderators.push(mod);
          return community;
        })
        .catch(() => {
          // If mod already exists (it shouldn't) pretend nothing happened
          return community;
        });
    }),
});
