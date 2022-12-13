import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createCommunitySchema } from "../../../pages/create_community";
import { router, protectedProcedure, publicProcedure } from "../trpc";

export const communitiesRouter = router({
  getCommunity: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.community.findUnique({ where: { name: input.name } });
    }),
  findCommunity: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.community
        .findMany({
          where: { name: { contains: input.name, mode: "insensitive" } },
          take: 12,
        })
        .then((values) => values);
    }),
  editCommunity: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(24),
        desc: z.string(),
        image: z.union([
          z.string().startsWith("https://").url(),
          z
            .string()
            .length(0)
            .transform(() => null),
        ]),
        logo: z.union([
          z.string().startsWith("https://").url(),
          z
            .string()
            .length(0)
            .transform(() => null),
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const community = await ctx.prisma.community.findUnique({
        where: { name: input.name },
      });
      if (!community || community.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const result = await ctx.prisma.community.update({
        where: { id: community.id },
        data: input,
      });
      return result;
    }),
  createCommunity: protectedProcedure
    .input(createCommunitySchema)
    .mutation(({ ctx, input }) => {
      const ownerId = ctx.session.user.id;
      return ctx.prisma.community
        .create({
          data: {
            name: input.name.toLowerCase(),
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
  // updateCommunitySettings: protectedProcedure.input(z.object({}))
});
