import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
  calculateSquare: publicProcedure
    .input(z.object({ num: z.number() }))
    .query(({ input }) => {
      return Math.pow(input.num, 2);
    }),
});
