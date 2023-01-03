import { banTimeOptions } from "./../../../pages/u/[...user_data]";
import { modOnlyProcedure } from "./../trpc";
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
          include: {
            moderators: {
              include: {
                user: {
                  select: {
                    bannedUntil: true,
                    id: true,
                    image: true,
                    isGlobalMod: true,
                    name: true,
                  },
                },
              },
            },
          },
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
      if (!user) {
        throw new TRPCError({
          message: "User not found.",
          code: "BAD_REQUEST",
        });
      }

      if (community.ownerId === user.id) {
        throw new TRPCError({
          message: "Can't add self as moderator.",
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
          include: {
            user: {
              select: {
                bannedUntil: true,
                id: true,
                image: true,
                isGlobalMod: true,
                name: true,
              },
            },
          },
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
  removeModerator: protectedProcedure
    .input(
      z.object({
        communityId: z.string().length(25),
        moderatorId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { id: input.communityId },
        include: {
          moderators: {
            include: {
              user: {
                select: {
                  bannedUntil: true,
                  id: true,
                  image: true,
                  isGlobalMod: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!community || community.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          message: "Community not found.",
          code: "BAD_REQUEST",
        });
      }

      // If the user is already not a mod do nothing
      if (
        !new Set(community.moderators.map((mod) => mod.userId)).has(
          input.moderatorId
        )
      ) {
        return community;
      }

      return await ctx.prisma.moderator
        .delete({
          where: {
            userId_communityId: {
              communityId: input.communityId,
              userId: input.moderatorId,
            },
          },
        })
        .then((mod) => {
          community.moderators = community.moderators.filter(
            (cur) => cur.userId !== mod.userId
          );
          return community;
        })
        .catch(() => {
          // Pretend nothing happened on error
          return community;
        });
    }),
  transferCommunity: protectedProcedure
    .input(
      z.object({
        communityId: z.string().length(25),
        newOwnerId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [community, newOwner] = await Promise.all([
        ctx.prisma.community.findUnique({
          where: { id: input.communityId },
          include: {
            moderators: {
              include: {
                user: {
                  select: {
                    bannedUntil: true,
                    id: true,
                    image: true,
                    isGlobalMod: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.user.findUnique({ where: { id: input.newOwnerId } }),
      ]);

      if (!community || community.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          message: "Community not found.",
          code: "BAD_REQUEST",
        });
      }

      if (!newOwner) {
        throw new TRPCError({
          message: "User not found.",
          code: "BAD_REQUEST",
        });
      }

      if (community.ownerId === newOwner.id) {
        throw new TRPCError({
          message: "Can't transfer community to self.",
          code: "BAD_REQUEST",
        });
      }

      const result = await ctx.prisma
        .$transaction([
          // Set new owner
          ctx.prisma.community.update({
            where: { id: input.communityId },
            data: { ownerId: input.newOwnerId },
          }),
          // Remove mod if was mod
          ctx.prisma.moderator.deleteMany({
            where: { communityId: input.communityId, userId: input.newOwnerId },
          }),
          // Set owner as 'normal' mod
          ctx.prisma.moderator.create({
            data: {
              communityId: input.communityId,
              userId: ctx.session.user.id,
            },
          }),
        ])
        .catch(() => false);

      return Boolean(result);
    }),
  setPostDeleted: protectedProcedure
    .input(
      z.object({
        postId: z.string().length(25),
        newDeletedStatus: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          community: {
            include: {
              moderators: {
                include: {
                  user: {
                    select: {
                      bannedUntil: true,
                      id: true,
                      image: true,
                      isGlobalMod: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!post) {
        throw new TRPCError({
          message: "Post not found.",
          code: "BAD_REQUEST",
        });
      }
      const isMod =
        ctx.session.user.isGlobalMod ||
        post.community.ownerId === ctx.session.user.id ||
        Boolean(
          post.community.moderators.find(
            (m) => m.userId === ctx.session.user.id
          )
        );
      if (!isMod) {
        throw new TRPCError({
          message: "Not moderator.",
          code: "BAD_REQUEST",
        });
      }

      await ctx.prisma.post.update({
        where: { id: input.postId },
        data: { isDeleted: input.newDeletedStatus, updatedAt: post.updatedAt },
      });
      post.isDeleted = input.newDeletedStatus;
      return post;
    }),
  nukePost: modOnlyProcedure
    .input(
      z.object({
        postId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.post.delete({ where: { id: input.postId } });
      return true;
    }),
  setCommentDeleted: protectedProcedure
    .input(
      z.object({
        commentId: z.string().length(25),
        newDeletedStatus: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        include: {
          post: {
            include: {
              community: {
                include: {
                  moderators: {
                    include: {
                      user: {
                        select: {
                          bannedUntil: true,
                          id: true,
                          image: true,
                          isGlobalMod: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!comment) {
        throw new TRPCError({
          message: "Post not found.",
          code: "BAD_REQUEST",
        });
      }
      const isMod =
        ctx.session.user.isGlobalMod ||
        comment.post.community.ownerId === ctx.session.user.id ||
        Boolean(
          comment.post.community.moderators.find(
            (m) => m.userId === ctx.session.user.id
          )
        );
      if (!isMod) {
        throw new TRPCError({
          message: "Not moderator.",
          code: "BAD_REQUEST",
        });
      }

      await ctx.prisma.comment.update({
        where: { id: input.commentId },
        data: {
          isDeleted: input.newDeletedStatus,
          updatedAt: comment.updatedAt,
        },
      });
      comment.isDeleted = input.newDeletedStatus;
      return comment.id;
    }),
  nukeComment: modOnlyProcedure
    .input(
      z.object({
        commentId: z.string().length(25),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.comment.delete({ where: { id: input.commentId } });
      return true;
    }),
  banUser: modOnlyProcedure
    .input(
      z.object({
        userId: z.string().length(25),
        reason: z.string().max(128),
        banTime: z.enum([...banTimeOptions, "Not Banned"] as const),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let nextUntilTime = new Date().getTime();
      if (input.banTime === "1 Minute") {
        nextUntilTime += 1000 * 60;
      } else if (input.banTime === "1 Hour") {
        nextUntilTime += 1000 * 60 * 60;
      } else if (input.banTime === "12 Hours") {
        nextUntilTime += 1000 * 60 * 60 * 12;
      } else if (input.banTime === "1 Day") {
        nextUntilTime += 1000 * 60 * 60 * 24;
      } else if (input.banTime === "1 Week") {
        nextUntilTime += 1000 * 60 * 60 * 24 * 7;
      } else if (input.banTime === "1 Month") {
        nextUntilTime += 1000 * 60 * 60 * 24 * 30;
      } else if (input.banTime === "Forever") {
        const forever = new Date(0);
        forever.setFullYear(9999, 11, 31);
        nextUntilTime = forever.getTime();
      } else {
        nextUntilTime = 0;
      }
      const bannedUntil = new Date(nextUntilTime);
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found.",
        });
      }
      if (user.isGlobalMod) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can not ban mods.",
        });
      }

      const res = await ctx.prisma
        .$transaction([
          ctx.prisma.user.update({
            where: { id: user.id },
            data: { bannedUntil: bannedUntil },
          }),
          ctx.prisma.ban.upsert({
            where: { bannedId: user.id },
            create: { reason: input.reason, bannedId: user.id },
            update: { bannedId: user.id, reason: input.reason },
          }),
        ])
        .then(() => true)
        .catch(() => false);
      return res;
    }),
});
