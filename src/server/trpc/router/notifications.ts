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
    .input(z.object({ notificationId: z.string().length(25) }))
    .mutation(async ({ ctx, input }) => {
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
      return await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: { seen: true },
      });
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
            include: { community: { select: { id: true, name: true } } },
          },
          relatedComment: true,
        },
      });
      // TODO: make this its own query
      //   const newNotificationsCountPromise = ctx.prisma.notification.count({
      //     where: { userId: ctx.session.user.id, seen: false },
      //   });
      //   const [notifications, newNotificationsCount] = await Promise.all([
      //     notificationsPromise,
      //     newNotificationsCountPromise,
      //   ]).catch(() => {
      //     throw new TRPCError({
      //       message: "Error fetching notifications.",
      //       code: "BAD_REQUEST",
      //     });
      //   });

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
