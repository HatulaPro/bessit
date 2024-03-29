import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { trpc } from "../utils/trpc";
import "../styles/globals.css";
import dynamic from "next/dynamic";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import Head from "next/head";

const TopBar = dynamic(
  () => import("../components/TopBar").then((x) => x.TopBar),
  {
    loading: () => (
      <div className="fixed top-0 z-50 flex h-12 w-full flex-row-reverse justify-between bg-zinc-700 p-2 text-white md:flex-row"></div>
    ),
  }
);

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useScrollRestoration();
  return (
    <>
      <Head>
        <meta
          name="google-site-verification"
          content="i2lVn2NFIbQos5gqEv7T0L2hfwir5fHbYisBREVXYKg"
        />
      </Head>
      <SessionProvider session={session}>
        <TopBar />
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
};

export default trpc.withTRPC(MyApp);
