import { TRPCError } from "@trpc/server";
import { createPostSchema } from "../../../components/PostEditor";
import { router, protectedProcedure } from "../trpc";

export const postsRouter = router({
  createPost: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
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
      const newPost = await ctx.prisma.post.create({
        data: {
          title: input.title,
          content: input.content,
          isDeleted: false,
          userId: userId,
          communityId: community.id,
        },
      });
      return newPost;
    }),
});
