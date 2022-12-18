import type { Community } from "@prisma/client";
import { type NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { BsStars } from "react-icons/bs";
import { CgComponents } from "react-icons/cg";
import { CommunityLogo } from "../components/CommunityLogo";
import { PostEditor } from "../components/PostEditor";
import { PostsViewer } from "../components/PostsViewer";
import {
  type PostsFromLastOptions,
  SortBySection,
  type SortingOptions,
} from "../components/SortBySection";
import { useCommunityPosts } from "../hooks/useCommunityPosts";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const [sortBy, setSortBy] = useState<SortingOptions>("hot");
  const [timeFilter, setTimeFilter] = useState<PostsFromLastOptions>("day");

  const communityPosts = useCommunityPosts(null, sortBy, timeFilter);

  return (
    <>
      <Head>
        <title>Bessit | The Best Reddit alternative </title>
        <meta
          name="description"
          content="The Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="mx-auto flex max-w-5xl items-start gap-6 bg-zinc-900 px-4 pt-12 md:pt-20">
        <div className="my-2 mx-auto flex flex-[3] flex-col items-center justify-center px-0.5">
          <PostEditor defaultOpen={false} />
          <hr className="block w-full max-w-3xl opacity-50 md:hidden" />
          <SortBySection
            isLoading={communityPosts.isLoading}
            sortBy={sortBy}
            setSortBy={setSortBy}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            allowFav
          />
          <PostsViewer communityPosts={communityPosts} />
        </div>
        <BrowseSection />
      </main>
    </>
  );
};

const BrowseSection: React.FC = () => {
  const session = useSession();

  const getFavoriteCommunitiesQuery =
    trpc.community.getFavoriteCommunities.useQuery(undefined, {
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: session.status === "authenticated",
      placeholderData: [
        {
          userId: "...",
          communityId: "communityId",
          community: {
            ownerId: "...",
            name: "community",
            desc: "words",
            id: "communityId",
            logo: null,
            image: null,
            rules: [],
          },
        },
      ],
    });

  const getTopCommunitiesQuery = trpc.community.getTopCommunities.useQuery(
    undefined,
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      placeholderData: [
        {
          ownerId: "...",
          name: "community",
          desc: "words",
          id: "communityId",
          logo: null,
          image: null,
          rules: [],
          _count: { members: 1 },
        },
      ],
    }
  );

  return (
    <div className="sticky top-20 hidden flex-1 md:block">
      <div className="my-2 rounded-md border-[1px] border-zinc-400 bg-zinc-800 p-4 text-white">
        <h2 className="mb-4 flex items-center gap-1 text-sm text-zinc-400">
          <BsStars className="text-lg text-white" /> Popular communities
        </h2>
        <div className="flex flex-col gap-1">
          {getTopCommunitiesQuery.data?.map((com) => (
            <SingleCommunityLink
              key={com.id}
              placeholder={!getTopCommunitiesQuery.isFetched}
              community={com}
            />
          ))}
        </div>
      </div>
      <div className="my-2 rounded-md border-[1px] border-zinc-400 bg-zinc-800 p-4 text-white">
        <h2 className="mb-4 flex items-center gap-1 text-sm text-zinc-400">
          <CgComponents className="text-lg text-white" /> Your communities
        </h2>
        {session.status !== "unauthenticated" ? (
          <div className="flex flex-col gap-1">
            {getFavoriteCommunitiesQuery.data?.map((favCom) => (
              <SingleCommunityLink
                key={favCom.communityId}
                placeholder={!getFavoriteCommunitiesQuery.isFetched}
                community={favCom.community}
              />
            ))}
            {getFavoriteCommunitiesQuery.data?.length === 0 && (
              <span className="text-sm">
                You haven&apos;t joined any community yet
              </span>
            )}
          </div>
        ) : (
          <p className="w-full text-left text-sm">
            <button
              onClick={() => signIn()}
              className="cursor-pointer text-indigo-500 hover:underline"
            >
              Log in
            </button>{" "}
            to join communities
          </p>
        )}
      </div>
    </div>
  );
};

const SingleCommunityLink: React.FC<{
  community: Community;
  placeholder: boolean;
}> = ({ community, placeholder }) => {
  return (
    <Link
      className={cx(
        "group flex items-center gap-1 rounded p-1 text-sm font-bold hover:bg-zinc-600 hover:bg-opacity-25",
        placeholder && "min-w-0 animate-pulse bg-zinc-600"
      )}
      href={`/b/${community.name}`}
    >
      <CommunityLogo name={community.name} logo={community.logo} size="small" />
      <span className="text-base text-gray-300 group-hover:underline">
        b/{community.name}
      </span>
    </Link>
  );
};

export default Home;
