import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export const useLoggedOnly = (to?: string) => {
  const router = useRouter();
  const { status: authStatus } = useSession({
    required: true,
    onUnauthenticated: () => {
      if (to) {
        router.replace(to);
      } else {
        router.back();
      }
    },
  });

  return authStatus;
};
