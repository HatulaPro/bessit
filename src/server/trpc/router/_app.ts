import { router } from "../trpc";
import { authRouter } from "./auth";
import { communitiesRouter } from "./communities";
import { postsRouter } from "./posts";
import { searchRouter } from "./search";

export const appRouter = router({
  auth: authRouter,
  community: communitiesRouter,
  post: postsRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
