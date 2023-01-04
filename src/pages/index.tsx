import type { Community } from "@prisma/client";
import { type NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { AiFillMeh } from "react-icons/ai";
import { BsPencilFill, BsStars } from "react-icons/bs";
import { CgComponents } from "react-icons/cg";
import { CommunityLogo } from "../components/CommunityLogo";
import { Dialog } from "../components/Dialog";
import { LinkToCommunity } from "../components/LinkToCommunity";
import { LoggedOnlyButton } from "../components/LoggedOnlyButton";
import { PostsViewer } from "../components/PostsViewer";
import {
  type PostsFromLastOptions,
  SortBySection,
  type SortingOptions,
} from "../components/SortBySection";
import { UserProfileLink } from "../components/UserProfileLink";
import { useCommunityPosts } from "../hooks/useCommunityPosts";
import { cx } from "../utils/general";
import {
  GET_FAVORITE_COMMUNITIES_PLACEHOLDER,
  GET_TOP_COMMUNITIES_PLACEHOLDER,
} from "../utils/placeholders";
import { trpc } from "../utils/trpc";
const PostEditor = dynamic(() =>
  import("../components/PostEditor").then((x) => x.PostEditor)
);

const Home: NextPage = () => {
  const [sortBy, setSortBy] = useState<SortingOptions>("new");
  const [timeFilter, setTimeFilter] =
    useState<PostsFromLastOptions>("all time");

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
      <main className="mx-auto flex max-w-5xl items-start gap-6 bg-zinc-900 pt-12 sm:px-4 md:pt-20">
        <div className="my-2 mx-auto flex flex-[3] flex-col items-center justify-center px-0.5">
          <CreatePostSuggestion />
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

const CreatePostSuggestion: React.FC = () => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const session = useSession();

  return (
    <>
      <div className="my-4 flex w-full items-center gap-4 rounded-md bg-zinc-800 p-1 md:p-4">
        {session.data?.user ? (
          <UserProfileLink user={session.data.user}>
            {session.data?.user?.image ? (
              <Image
                className="h-8 w-8 rounded-full md:h-12 md:w-12"
                loader={({ src }) => src}
                src={session.data.user.image}
                alt="Profile Image"
                width={48}
                height={48}
                priority
              />
            ) : (
              <AiFillMeh className="h-8 w-8 rounded-full text-white md:h-12 md:w-12" />
            )}
          </UserProfileLink>
        ) : (
          <Image
            className="h-8 w-8 rounded-full md:h-12 md:w-12"
            src="/bessit_logo.png"
            alt="Profile Image"
            width={48}
            height={48}
            priority
          />
        )}
        <LoggedOnlyButton
          Child={(props) => (
            <button
              {...props}
              className="flex-1 rounded-md border-2 border-zinc-600 bg-zinc-700 px-4 py-1  text-left text-zinc-200 hover:bg-zinc-600 hover:text-zinc-100 active:border-zinc-500 sm:py-2"
            >
              Create post
            </button>
          )}
          onClick={() => setOpen(true)}
          icon={<BsPencilFill className="text-white" />}
          title={<>Share your awesome post</>}
          content="Join Bessit to share your thoughts with our incredible community"
        />
      </div>
      <Dialog close={() => setOpen(false)} isOpen={isOpen}>
        <PostEditor />
      </Dialog>
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
      placeholderData: GET_FAVORITE_COMMUNITIES_PLACEHOLDER,
    });

  const getTopCommunitiesQuery = trpc.community.getTopCommunities.useQuery(
    undefined,
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      placeholderData: GET_TOP_COMMUNITIES_PLACEHOLDER,
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
                You haven&apos;t joined any communities yet
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
    <LinkToCommunity
      community={community}
      className={cx(
        "group flex items-center gap-1 rounded p-1 text-sm font-bold hover:bg-zinc-600 hover:bg-opacity-25",
        placeholder && "min-w-0 animate-pulse bg-zinc-600"
      )}
    >
      <>
        <CommunityLogo
          name={community.name}
          logo={community.logo}
          size="small"
        />
        <span className="text-base text-gray-300 group-hover:underline">
          b/{community.name}
        </span>
      </>
    </LinkToCommunity>
  );
};

export default Home;
