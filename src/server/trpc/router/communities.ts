import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCommunitySchema } from "../../../pages/create_community";
import { router, protectedProcedure, publicProcedure } from "../trpc";

export const communitiesRouter = router({
  getCommunity: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.community
        .findUnique({ where: { name: input.name } })
        .then((res) => {
          return res;
        })
        .catch((reason) => {
          throw new TRPCError(reason);
        });
    }),
  findCommunity: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      console.log("name", input.name);
      return ctx.prisma.community
        .findMany({
          where: { name: { contains: input.name } },
          take: 12,
        })
        .then((values) => values);
    }),
  createCommunity: protectedProcedure
    .input(createCommunitySchema)
    .mutation(({ ctx, input }) => {
      const ownerId = ctx.session.user.id;
      return ctx.prisma.community
        .create({
          data: {
            name: input.name,
            desc: input.desc,
            image: null,
            logo: null,
            ownerId: ownerId,
          },
        })
        .then((newCommunity) => {
          return newCommunity;
        })
        .catch(() => {
          throw new TRPCError({
            message: "Community name is already taken.",
            code: "BAD_REQUEST",
          });
        });
    }),
});
