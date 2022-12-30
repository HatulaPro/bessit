import { z } from "zod";
import { router, publicProcedure } from "../trpc";

export const searchRouter = router({
  search: publicProcedure
    .input(z.object({ q: z.string() }))
    .query(async ({ ctx, input }) => {
      const query: Record<"username" | "community", string | null> = {
        username: null,
        community: null,
      };
      if (input.q.startsWith("u/")) {
        query.username = input.q.slice(2);
      } else if (input.q.startsWith("/u/")) {
        query.username = input.q.slice(3);
      } else if (input.q.startsWith("b/")) {
        query.community = input.q.slice(2);
      } else if (input.q.startsWith("/b/")) {
        query.community = input.q.slice(3);
      } else {
        query.username = input.q;
        query.community = input.q;
      }

      return {
        users: query.username
          ? await ctx.prisma.user.findMany({
              take: 6,
              where: {
                name: {
                  contains: query.username,
                  not: null,
                  mode: "insensitive",
                },
              },
              select: { id: true, name: true, image: true },
            })
          : null,
        communities: query.community
          ? await ctx.prisma.community.findMany({
              take: 6,
              where: {
                name: { contains: query.community, mode: "insensitive" },
                // Hacky filter to make sure there is at least one post in the community before showing it
                posts: { some: { title: { not: "" } } },
              },
              select: {
                id: true,
                name: true,
                desc: true,
                logo: true,
                image: true,
              },
            })
          : null,
      };
    }),
  getTaggedUser: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.prisma.user.findFirst({
        take: 1,
        where: {
          name: {
            equals: input.name,
          },
        },
        select: { id: true, name: true, image: true },
      });
      return result;
    }),
});
