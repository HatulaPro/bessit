import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { IoMdClose } from "react-icons/io";
import { useLoggedOnly } from "../../../../hooks/useLoggedOnly";
import { trpc, type RouterOutputs } from "../../../../utils/trpc";
import dynamic from "next/dynamic";

const CommunitySettingsComponents = dynamic(
  () => import("../../../../components/CommunitySettingsComponents")
);

const CommunitySettingsPage: NextPage = () => {
  const pageTitle = "Bessit | Community Settings";
  const router = useRouter();
  const community_name = router.query.community_name as string | undefined;
  useLoggedOnly(community_name ? `/b/${community_name}` : "/");

  const getCommunityQuery = trpc.community.getCommunity.useQuery(
    { name: community_name || "UNSENDABLE" },
    {
      enabled: community_name !== undefined,
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Edit the settings of your Bessit community."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center bg-zinc-900 pt-16 pb-2 text-white md:pt-20">
        {getCommunityQuery.data && (
          <div className="mb-10 w-full max-w-3xl rounded border-2 border-zinc-800 p-8">
            <CommunitySettingsComponents community={getCommunityQuery.data} />
          </div>
        )}

        <button
          onClick={() => {
            if (!getCommunityQuery.data) return router.back();
            router.replace(`/b/${getCommunityQuery.data.name}`);
          }}
          className="absolute right-12 top-20 hidden items-center gap-1 rounded-xl px-2 py-1 text-white hover:bg-white hover:bg-opacity-10 md:flex"
        >
          <IoMdClose className="text-2xl" />
          <span className="text-sm">Back</span>
        </button>
      </main>
    </>
  );
};

export type CommunityReturnType = Exclude<
  RouterOutputs["community"]["getCommunity"],
  null
>;

export default CommunitySettingsPage;
