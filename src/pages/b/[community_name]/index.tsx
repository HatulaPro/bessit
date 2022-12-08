import type { Community } from "@prisma/client";
import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { Dialog } from "../../../components/Dialog";
import { Loading } from "../../../components/Loading";
import { NotFoundMessage } from "../../../components/NotFoundMessage";
import { PostEditor } from "../../../components/PostEditor";
import { PostsViewer } from "../../../components/PostsViewer";
import { SortBySection } from "../../../components/SortBySection";
import type { SortingOptions } from "../../../components/SortBySection";
import { useCommunityPosts } from "../../../hooks/useCommunityPosts";
import { CommunityLogo } from "../../../components/CommunityLogo";

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
        {typeof community_name !== "string" ? (
          router.query ? (
            <Loading size="large" show />
          ) : (
            <NotFoundMessage message="This community does not seem to exist" />
          )
        ) : (
          <CommunityPageContent name={community_name} />
        )}
      </main>
    </>
  );
};

export default CommunityPage;

const CommunityPageContent: React.FC<{ name: string }> = ({ name }) => {
  const [sortBy, setSortBy] = useState<SortingOptions>("new");
  const communityPosts = useCommunityPosts(name, sortBy);

  if (!communityPosts.community) {
    if (communityPosts.isLoading) {
      return <Loading size="large" show />;
    }
    return <NotFoundMessage message="This community does not seem to exist" />;
  }
  return (
    <div className="w-full">
      <CommunityHeader community={communityPosts.community} />
      <div className="container mx-auto flex max-w-5xl items-start justify-center gap-8 px-0 md:px-2">
        <div className="flex-[3]">
          <SortBySection
            isLoading={communityPosts.isLoading}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <PostsViewer communityPosts={communityPosts} />
        </div>
        <AboutCommunity community={communityPosts.community} />
      </div>
    </div>
  );
};

const CommunityHeader: React.FC<{ community: Community }> = ({ community }) => {
  return (
    <>
      <div className="bg-rotate h-40 w-full bg-gradient-radial from-stone-700 bg-[length:12px_12px] md:h-64">
        {community.image && (
          <Image
            src={community.image}
            alt={`Community image of ${community.name}`}
            fill
          />
        )}
      </div>
      <div className="mb-2 flex w-full flex-col items-center justify-center bg-black">
        <div className="flex w-full max-w-xl -translate-y-1/3 items-center gap-6 md:max-w-3xl">
          <CommunityLogo
            name={community.name}
            logo={community.logo}
            size="large"
          />
          <h1 className="text-3xl">{community.name}</h1>
        </div>
      </div>
    </>
  );
};

const AboutCommunity: React.FC<{ community: Community }> = ({ community }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const { status: authStatus } = useSession();

  return (
    <div className="sticky top-20 my-4 hidden flex-1 rounded-md border-[1px] border-zinc-400 bg-zinc-800 p-4 md:block">
      <h2 className="text-center text-xl text-zinc-400">About Community</h2>
      <p>{community.desc}</p>
      <hr className="m-2" />
      {authStatus === "authenticated" ? (
        <button
          onClick={() => setOpen(true)}
          className="mx-auto block w-2/3 rounded-lg bg-zinc-300 p-1 text-center font-bold text-black hover:bg-zinc-400 active:bg-zinc-500"
        >
          Create Post
        </button>
      ) : (
        <p className="w-full text-left text-sm">
          <button
            onClick={() => signIn()}
            className="cursor-pointer text-indigo-500 hover:underline"
          >
            Log in
          </button>{" "}
          to post
        </p>
      )}
      <Dialog close={() => setOpen(false)} isOpen={isOpen}>
        <PostEditor defaultCommunity={community.name} defaultOpen />
      </Dialog>
    </div>
  );
};
