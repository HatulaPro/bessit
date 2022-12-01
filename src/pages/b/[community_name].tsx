import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loading } from "../../components/Loading";
import { TopBar } from "../../components/TopBar";
import { trpc } from "../../utils/trpc";

const CommunityPage: NextPage = () => {
  const router = useRouter();
  const community_name = router.query.community_name;
  const pageTitle = `Bessit | ${community_name}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="View a community on the Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full flex-col items-center bg-zinc-900 pb-2 text-white">
        <TopBar />
        {typeof community_name !== "string" ? (
          <CommunityNotFound />
        ) : (
          <CommunityPageContent name={community_name} />
        )}
      </main>
    </>
  );
};

export default CommunityPage;

const CommunityPageContent: React.FC<{ name: string }> = ({ name }) => {
  const communityQuery = trpc.community.getCommunity.useQuery(
    { name },
    {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 60 * 1000,
      cacheTime: Infinity,
    }
  );
  if (communityQuery.isLoading) {
    return <Loading show />;
  } else if (!communityQuery.data) {
    return <CommunityNotFound />;
  }
  return (
    <div className="w-full">
      <div className="bg-rotate h-40 w-full bg-gradient-radial from-stone-700 bg-[length:12px_12px] md:h-64">
        {communityQuery.data.image && (
          <Image
            src={communityQuery.data.image}
            alt={`Community image of ${communityQuery.data.name}`}
            fill
          />
        )}
      </div>
      <div className="mb-2 flex w-full flex-col items-center justify-center bg-black">
        <div className="flex w-full max-w-xl -translate-y-1/3 items-center gap-6 md:max-w-3xl">
          <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 border-zinc-400 bg-indigo-800 text-5xl md:h-24 md:w-24 md:text-7xl">
            {communityQuery.data.logo ? (
              <Image
                src={communityQuery.data.logo}
                alt={`Community logo of ${communityQuery.data.name}`}
                fill
              />
            ) : (
              communityQuery.data.name[0]?.toUpperCase()
            )}
          </div>
          <h1 className="text-3xl">{communityQuery.data.name}</h1>
        </div>
      </div>
      <div className="container mx-auto flex max-w-5xl items-start justify-center gap-16 px-0 md:px-2">
        <div className="flex-[2] border-[1px] border-x-0 border-zinc-400 bg-zinc-800 p-4 md:rounded-md md:border-x-[1px]">
          <h2 className="text-center text-xl text-zinc-400">Posts</h2>
          {new Array(25).fill(0).map((_, i) => (
            <p key={i}>A lot of data</p>
          ))}
        </div>
        <div className="hidden flex-1 rounded-md border-[1px] border-zinc-400 bg-zinc-800 p-4 md:block">
          <h2 className="text-center text-xl text-zinc-400">About Community</h2>
          <p>{communityQuery.data.desc}</p>
          <hr className="m-2" />
          <Link
            href="/"
            className="mx-auto block w-2/3 rounded-lg bg-zinc-300 p-1 text-center font-bold text-black hover:bg-zinc-400 active:bg-zinc-500"
          >
            Create Post
          </Link>
        </div>
      </div>
    </div>
  );
};

const CommunityNotFound: React.FC = () => {
  return (
    <div className="container">
      <h1 className="text-3xl text-white">
        This community does not seem to exist
      </h1>
    </div>
  );
};
