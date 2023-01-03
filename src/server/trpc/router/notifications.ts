import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationsRouter = router({
  getNumberOfUnseenNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.notification.count({
      where: { userId: ctx.session.user.id, seen: false },
    });
  }),
  setNotificationAsSeen: protectedProcedure
    .input(z.object({ notificationId: z.string().length(25).nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (input.notificationId) {
        const notification = await ctx.prisma.notification.findUnique({
          where: { id: input.notificationId },
          select: { id: true, userId: true },
        });
        if (!notification || notification.userId !== ctx.session.user.id) {
          throw new TRPCError({
            message: "Notification not found",
            code: "BAD_REQUEST",
          });
        }
        await ctx.prisma.notification.update({
          where: { id: input.notificationId },
          data: { seen: true },
        });
        return 1;
      } else {
        const res = await ctx.prisma.notification.updateMany({
          where: { userId: ctx.session.user.id, seen: false },
          data: { seen: true },
        });
        return res.count;
      }
    }),
  getNotifications: protectedProcedure
    .input(
      z.object({
        count: z.number().min(4).max(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await ctx.prisma.notification.findMany({
        orderBy: { updatedAt: "desc" },
        where: { userId: ctx.session.user.id },
        take: input.count + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          newComment: {
            include: {
              user: { select: { id: true, image: true, name: true } },
            },
          },
          relatedPost: {
            include: {
              community: { select: { id: true, name: true } },
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
          relatedComment: true,
        },
      });

      if (notifications.length < input.count) {
        return {
          notifications: notifications,
          nextCursor: undefined,
        };
      }
      const nextCursor =
        notifications.length > 0 ? notifications.pop()?.id : undefined;
      return {
        notifications: notifications,
        nextCursor,
      };
    }),
});
