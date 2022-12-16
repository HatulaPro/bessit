import { router } from "../trpc";
import { authRouter } from "./auth";
import { communitiesRouter } from "./communities";
import { postsRouter } from "./posts";
import { searchRouter } from "./search";
import { notificationsRouter } from "./notifications";
import { userRouter } from "./user";
import { moderationRouter } from "./moderation";

export const appRouter = router({
  auth: authRouter,
  community: communitiesRouter,
  post: postsRouter,
  search: searchRouter,
  notification: notificationsRouter,
  user: userRouter,
  moderator: moderationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
