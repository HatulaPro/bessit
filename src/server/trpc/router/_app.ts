import { router } from "../trpc";
import { authRouter } from "./auth";
import { communitiesRouter } from "./communities";
import { postsRouter } from "./posts";

export const appRouter = router({
  auth: authRouter,
  community: communitiesRouter,
  post: postsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
