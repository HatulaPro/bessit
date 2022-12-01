import { router } from "../trpc";
import { authRouter } from "./auth";
import { exampleRouter } from "./example";
import { communitiesRouter } from "./communities";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  community: communitiesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
