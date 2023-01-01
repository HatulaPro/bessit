import type { NextPage } from "next";
import { signIn, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { Dialog } from "../../../components/Dialog";
import { Loading } from "../../../components/Loading";
import { NotFoundMessage } from "../../../components/NotFoundMessage";
import { PostsViewer } from "../../../components/PostsViewer";
import {
  type PostsFromLastOptions,
  type SortingOptions,
  SortBySection,
} from "../../../components/SortBySection";
import { useCommunityPosts } from "../../../hooks/useCommunityPosts";
import { CommunityLogo } from "../../../components/CommunityLogo";
import { BsGearFill, BsPencil } from "react-icons/bs";
import { ImageHidesOnError } from "../../../components/ImageHidesOnError";
import Link from "next/link";
import { cx } from "../../../utils/general";
import { AiFillCaretDown, AiOutlineInfoCircle } from "react-icons/ai";
import { type RouterOutputs, trpc } from "../../../utils/trpc";
import { LoggedOnlyButton } from "../../../components/LoggedOnlyButton";
import { CgComponents } from "react-icons/cg";
import { NotBannedOnlyButton } from "../../../components/NotBannedOnlyButton";

import dynamic from "next/dynamic";

const PostEditor = dynamic(() =>
  import("../../../components/PostEditor").then((x) => x.PostEditor)
);

const CommunityPage: NextPage = () => {
  const router = useRouter();
  const community_name = router.query.community_name;
  const pageTitle = `Bessit | ${community_name ?? "View Community"}`;

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
  const [timeFilter, setTimeFilter] =
    useState<PostsFromLastOptions>("all time");
  const communityPosts = useCommunityPosts(name, sortBy, timeFilter);

  if (!communityPosts.community) {
    return <NotFoundMessage message="This community does not seem to exist" />;
  }

  const showPlaceholder =
    communityPosts.isLoading && communityPosts.posts.length === 0;

  return (
    <div className="w-full pt-12 md:pt-16">
      <CommunityHeader
        placeholder={showPlaceholder}
        community={communityPosts.community}
      />
      <div className="container mx-auto flex max-w-5xl items-start justify-center gap-8 px-0 md:px-2">
        <div className="flex flex-[3] flex-col">
          <SortBySection
            isLoading={communityPosts.isLoading}
            sortBy={sortBy}
            setSortBy={setSortBy}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            allowFav={false}
          />
          {!showPlaceholder && <PostsViewer communityPosts={communityPosts} />}
        </div>
        <AboutCommunity
          community={communityPosts.community}
          placeholder={showPlaceholder}
        />
      </div>
    </div>
  );
};

const CommunityHeader: React.FC<{
  community: Exclude<RouterOutputs["community"]["getCommunity"], null>;
  placeholder: boolean;
}> = ({ community, placeholder }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const session = useSession();
  const isMember =
    session.status === "authenticated" && community.members.length === 1;

  const utils = trpc.useContext();
  const joinCommunityMutation = trpc.community.joinCommunity.useMutation({
    onSuccess: () => {
      utils.community.invalidate();
      utils.community.getCommunity.setData({ name: community.name }, () => {
        return {
          ...community,
          _count: {
            ...community._count,
            members: community._count.members + 1,
          },
          members: [
            {
              communityId: community.id,
              userId: session.data?.user?.id ?? "THIS_IS_A_USER",
            },
          ],
        };
      });
    },
  });

  const leaveCommunityMutation = trpc.community.leaveCommunity.useMutation({
    onSuccess: () => {
      utils.community.invalidate();
      utils.community.getCommunity.setData({ name: community.name }, () => {
        return {
          ...community,
          _count: {
            ...community._count,
            members: community._count.members - 1,
          },
          members: [],
        };
      });
    },
  });

  return (
    <>
      <div className="bg-rotate relative h-40 w-full overflow-hidden bg-gradient-radial from-stone-700 bg-[length:12px_12px] md:h-64">
        {community.image && (
          <ImageHidesOnError
            src={community.image}
            loader={({ src }) => src}
            alt={`Community image of ${community.name}`}
            className="scale-125 object-cover opacity-0"
            onLoad={(e) => {
              e.currentTarget.animate(
                [
                  { opacity: "0", transform: "scale(1.25)", offset: 0.05 },
                  { opacity: "0.9", transform: "scale(1.15)", offset: 0.5 },
                  { opacity: "1", transform: "scale(1)" },
                ],
                {
                  duration: 1500,
                  fill: "forwards",
                  easing: "ease-out",
                }
              );
            }}
            fill
            priority
          />
        )}
      </div>
      <div className="mb-2 flex w-full flex-col items-center justify-center bg-zinc-700 bg-opacity-80">
        <div className="flex w-full max-w-xl justify-center">
          <div className="flex w-full -translate-y-1/4 items-center gap-4 md:max-w-3xl">
            <CommunityLogo
              placeholder={placeholder}
              name={community.name}
              logo={community.logo}
              size="large"
            />
            <h1
              className={cx(
                "text-3xl font-bold",
                placeholder && "h-9 min-w-0 animate-pulse rounded bg-zinc-600"
              )}
            >
              {community.name}
            </h1>
          </div>
          <div>
            <LoggedOnlyButton
              Child={(props) => (
                <button
                  {...props}
                  className="ml-auto mt-1 mr-2 block rounded-full bg-green-600 py-0.5 px-3 text-sm enabled:hover:bg-green-700 disabled:contrast-50 md:my-2 md:py-1 md:px-4 md:text-base"
                  disabled={
                    leaveCommunityMutation.isLoading ||
                    joinCommunityMutation.isLoading ||
                    placeholder
                  }
                >
                  {isMember ? "Joined" : "Join"}
                </button>
              )}
              onClick={() => {
                if (isMember) {
                  leaveCommunityMutation.mutate({ name: community.name });
                } else {
                  joinCommunityMutation.mutate({ name: community.name });
                }
              }}
              icon={<CgComponents className="text-green-600" />}
              title={
                <>
                  Join the wonderful community of{" "}
                  <Link
                    className="text-indigo-400 hover:underline"
                    href={`/b/${community.name}`}
                  >
                    b/{community.name}
                  </Link>
                  !
                </>
              }
              content="Log in to Bessit to participate in our communities"
            />
            <div className="flex gap-1">
              {!placeholder && (
                <AboutCommunityButtonMobile community={community} />
              )}
              <NotBannedOnlyButton
                onClick={() => setOpen(true)}
                Child={(props) => (
                  <button
                    {...props}
                    className="group relative my-2 mr-2 self-end rounded-full p-2 text-lg text-white md:hidden"
                  >
                    <BsPencil />
                    <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-zinc-500 bg-opacity-25 transition-transform group-active:scale-100"></div>
                  </button>
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {session.status === "authenticated" && (
        <Dialog close={() => setOpen(false)} isOpen={isOpen}>
          <PostEditor defaultCommunity={community.name} defaultOpen />
        </Dialog>
      )}
    </>
  );
};

const AboutCommunity: React.FC<{
  community: Exclude<RouterOutputs["community"]["getCommunity"], null>;
  placeholder: boolean;
  mobile?: boolean;
}> = ({ community, placeholder, mobile }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const session = useSession();

  return (
    <div
      className={cx(
        "flex-[1.25] rounded-md border-[1px] border-zinc-400 bg-zinc-800 p-4",
        mobile ? "my-auto" : "sticky top-20 my-4 hidden md:block"
      )}
    >
      <h2 className="mb-2 text-center text-xl text-zinc-300">
        About Community
      </h2>
      <p
        className={cx(
          placeholder && "h-16 w-full animate-pulse rounded bg-zinc-600"
        )}
      >
        {community.desc}
      </p>
      <p className="mt-5 text-sm text-zinc-300">
        {community._count.members} members
      </p>
      <hr className="my-2 mx-2 mb-7" />
      <AboutCommunityRules rules={community.rules} />
      <hr className="my-7 mx-2" />
      {session.status === "authenticated" ? (
        <>
          <button
            onClick={() => setOpen(true)}
            disabled={placeholder}
            className="mx-auto block w-2/3 rounded-lg bg-zinc-300 p-1 text-center font-bold text-black hover:bg-zinc-400 active:bg-zinc-500"
          >
            Create Post
          </button>
          {session.data.user?.id === community.ownerId && (
            <Link
              href={`/b/${community.name}/community_settings`}
              className="mt-6 flex cursor-pointer items-center gap-2 text-sm hover:underline"
            >
              <BsGearFill /> Edit Community
            </Link>
          )}
        </>
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

const AboutCommunityButtonMobile: React.FC<{
  community: Exclude<RouterOutputs["community"]["getCommunity"], null>;
}> = ({ community }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative my-2 self-end rounded-full p-2 text-xl text-white md:hidden"
      >
        <AiOutlineInfoCircle />
        <div className="absolute inset-0 h-full w-full scale-0 rounded-full bg-zinc-500 bg-opacity-25 transition-transform group-active:scale-100"></div>
      </button>
      <Dialog isOpen={isOpen} close={() => setOpen(false)}>
        <AboutCommunity placeholder={false} community={community} mobile />
      </Dialog>
    </>
  );
};

const AboutCommunityRules: React.FC<{ rules: string[] }> = ({ rules }) => {
  const [activeRule, setActiveRule] = useState<number>(-1);
  const structuredRules = useMemo(() => {
    const result = [];
    for (let i = 0; i < rules.length; i += 2) {
      result.push({
        title: rules[i] as string,
        content: rules[i + 1] as string,
      });
    }
    return result;
  }, [rules]);
  return (
    <div className="flex w-full flex-col gap-0.5 rounded py-1">
      <h4 className="text-center text-lg text-zinc-300">Rules</h4>
      {structuredRules.map((rule, index) => (
        <button
          key={index}
          className="flex flex-wrap items-center px-1 py-0.5 hover:bg-zinc-900"
          onClick={() => setActiveRule(activeRule === index ? -1 : index)}
        >
          <span
            className={cx(
              "text-lg font-bold transition-colors",
              activeRule === index ? "text-indigo-300" : "text-white"
            )}
          >
            {rule.title}
          </span>
          <AiFillCaretDown
            className={cx(
              "ml-auto transition-transform",
              activeRule === index ? "rotate-90" : "rotate-0"
            )}
          />
          <div
            className={cx(
              "w-full basis-full overflow-hidden pr-1.5 pl-2.5 text-left transition-all",
              activeRule === index ? "max-h-[12rem]" : "max-h-0"
            )}
          >
            {rule.content}
          </div>
        </button>
      ))}
      {structuredRules.length === 0 && "This community has no rules"}
    </div>
  );
};
