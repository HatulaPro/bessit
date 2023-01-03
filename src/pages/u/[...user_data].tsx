import type { NextPage } from "next";
import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { AiFillMeh } from "react-icons/ai";
import {
  BsClock,
  BsDot,
  BsFillExclamationTriangleFill,
  BsFillShieldFill,
  BsFlag,
  BsSuitHeartFill,
} from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { Dialog } from "../../components/Dialog";
import { LinkToPost } from "../../components/LinkToPost";
import { Loading } from "../../components/Loading";
import { NotFoundMessage } from "../../components/NotFoundMessage";
import { cx, slugify, timeAgo } from "../../utils/general";
import { type RouterOutputs, trpc } from "../../utils/trpc";

const ProfilePage: NextPage = () => {
  const {
    userData,
    isLoadingUser: isLoading,
    is404,
    posts,
    comments,
    currentlyViewing,
    setCurrentlyViewing,
    isLoadingPosts,
  } = useUserProfileData();
  const pageTitle = `Bessit | ${userData?.user.name || "User Profile"}`;

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
      <main className="flex min-h-screen w-full flex-col items-center bg-zinc-900 pb-2 pt-12 text-white md:pt-16">
        {isLoading ? (
          <Loading size="large" show />
        ) : is404 ? (
          <NotFoundMessage message="This user does not seem to exist" />
        ) : userData ? (
          <UserProfileContent
            isLoadingPosts={isLoadingPosts}
            userData={userData}
            posts={posts}
            comments={comments}
            currentlyViewing={currentlyViewing}
            setCurrentlyViewing={setCurrentlyViewing}
          />
        ) : (
          <Loading size="large" show />
        )}
      </main>
    </>
  );
};

export default ProfilePage;

const useUserProfileData = () => {
  const [currentlyViewing, setCurrentlyViewing] = useState<
    "posts" | "comments"
  >("posts");
  const router = useRouter();
  const queryData = router.query.user_data
    ? (router.query as { user_data: string[] })
    : undefined;

  const getUserQuery = trpc.user.getUser.useQuery(
    { userId: queryData?.user_data[0] ?? "NOT_SENDABLE" },
    {
      enabled: Boolean(queryData) && document.hasFocus(),
      refetchOnReconnect: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 5,
      retry: false,
      onSuccess: (data) => {
        if (data) {
          router.replace(
            `/u/${data.user.id}/${slugify(data.user.name ?? "username")}`,
            undefined,
            { shallow: true }
          );
        }
      },
    }
  );

  const getUserPostsQuery = trpc.user.getUserPosts.useInfiniteQuery(
    { userId: queryData?.user_data[0] ?? "NOT_SENDABLE", count: 25 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(queryData),
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      retry: false,
    }
  );

  const getUserCommentsQuery = trpc.user.getUserComments.useInfiniteQuery(
    { userId: queryData?.user_data[0] ?? "NOT_SENDABLE", count: 25 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(queryData),
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      retry: false,
    }
  );

  useEffect(() => {
    const relevantQuery =
      currentlyViewing === "posts" ? getUserPostsQuery : getUserCommentsQuery;
    const listener = () => {
      if (
        relevantQuery.isLoading ||
        relevantQuery.isFetchingNextPage ||
        !relevantQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 800 >
        document.body.offsetHeight
      ) {
        relevantQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [getUserPostsQuery, getUserCommentsQuery, currentlyViewing]);

  const flattenedUserPosts = useMemo(() => {
    return (
      getUserPostsQuery.data?.pages.reduce<
        typeof getUserPostsQuery["data"]["pages"][number]["posts"]
      >((acc, cur) => {
        acc.push(...cur.posts);
        return acc;
      }, []) || []
    );
  }, [getUserPostsQuery]);

  const flattenedUserComments = useMemo(() => {
    return (
      getUserCommentsQuery.data?.pages.reduce<
        typeof getUserCommentsQuery["data"]["pages"][number]["comments"]
      >((acc, cur) => {
        acc.push(...cur.comments);
        return acc;
      }, []) || []
    );
  }, [getUserCommentsQuery]);

  return {
    is404: !getUserQuery.isLoading && !getUserQuery.data,
    userData: getUserQuery.data || null,
    isLoadingUser: getUserQuery.isLoading,
    isLoadingPosts:
      getUserPostsQuery.isLoading ||
      getUserPostsQuery.isFetching ||
      getUserCommentsQuery.isLoading ||
      getUserCommentsQuery.isFetching,
    posts: flattenedUserPosts,
    comments: flattenedUserComments,
    currentlyViewing,
    setCurrentlyViewing,
  };
};

type FullUser = Exclude<RouterOutputs["user"]["getUser"], null>;

const UserDataSection: React.FC<{
  userData: FullUser;
}> = ({ userData }) => {
  const session = useSession();
  function randomlyGeneratedGoodAdjective() {
    const WORDS = [
      "Wholesome",
      "Fantastic",
      "Great",
      "Wonderful",
      "Valuable",
      "Well Appreciated",
    ];
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }
  const isBanned = new Date(userData.user.bannedUntil) > new Date();

  return (
    <div className="container relative mx-auto my-4 max-w-sm rounded border-2 border-zinc-500 bg-zinc-800 p-3 md:max-w-md">
      <div className="absolute inset-0 h-32 w-full bg-indigo-700"></div>
      <div className="relative flex-col justify-center text-center">
        {userData.user.image ? (
          <Image
            className="mx-auto rounded-md"
            loader={({ src }) => src}
            src={userData.user.image}
            alt="Profile Image"
            width={112}
            height={112}
            priority
          />
        ) : (
          <AiFillMeh className="mx-auto h-28 w-28 rounded-md bg-zinc-600 bg-opacity-60" />
        )}
        <h1 className="my-1 text-2xl">
          <span
            className={cx(
              "inline-block h-4 w-4 rounded-full",
              isBanned
                ? "border-2 border-red-500 bg-red-600"
                : userData.user._count.sessions
                ? "bg-green-600"
                : "border-2 border-zinc-500 bg-zinc-600"
            )}
          ></span>{" "}
          u/{userData.user.name}
          {userData.user.id === session.data?.user?.id && (
            <span className="text-lg text-zinc-300"> (you)</span>
          )}
        </h1>
        <span className="text-sm font-normal text-zinc-400">
          ID: {userData.user.id}
        </span>

        <div className="mt-4 flex w-full justify-evenly">
          <div className="flex flex-col text-center">
            <span>Post Likes</span>
            <span>
              <BsSuitHeartFill className="mr-1.5 inline-block text-red-500" />
              {userData.postVotes}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span> Comment Likes</span>
            <span>
              <BsSuitHeartFill className="mr-1.5 inline-block text-red-500" />
              {userData.commentVotes}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <span>
          <span className="text-lg font-bold underline decoration-indigo-500">
            #{userData.user._count.posts}
          </span>{" "}
          {randomlyGeneratedGoodAdjective()} Posts
        </span>
        <span>
          <span className="text-lg font-bold underline decoration-indigo-500">
            #{userData.user._count.comment}
          </span>{" "}
          {randomlyGeneratedGoodAdjective()} Comments
        </span>
      </div>
      {userData.user.isGlobalMod && (
        <div className="mt-4 flex justify-center gap-1 text-sm">
          <BsFillShieldFill className="ml-1 text-lg text-green-600" />
          <span>Official Bessit Mod</span>
        </div>
      )}
      {userData.user.id === session.data?.user?.id && (
        <button
          className="mx-auto mt-2 block rounded bg-red-900 px-3 py-1 hover:bg-red-800"
          onClick={() => signOut()}
        >
          Log Out
        </button>
      )}
    </div>
  );
};

const GoBackButton: React.FC = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        router.back();
      }}
      className="absolute right-12 top-8 hidden items-center gap-1 rounded-xl px-2 py-1 text-white hover:bg-white hover:bg-opacity-10 md:flex"
    >
      <IoMdClose className="text-2xl" />
      <span className="text-sm">Back</span>
    </button>
  );
};

const UserProfilePosts: React.FC<{
  isLoadingPosts: boolean;
  posts: RouterOutputs["user"]["getUserPosts"]["posts"];
  comments: RouterOutputs["user"]["getUserComments"]["comments"];
  currentlyViewing: "posts" | "comments";
  userData: Exclude<RouterOutputs["user"]["getUser"], null>;
  setCurrentlyViewing: (x: "posts" | "comments") => void;
}> = ({
  posts,
  comments,
  userData,
  isLoadingPosts,
  currentlyViewing,
  setCurrentlyViewing,
}) => {
  return (
    <>
      <div className="my-1 mx-auto flex w-full max-w-sm flex-col md:max-w-md">
        <div className="justify-left mt-4 mb-2 flex w-full max-w-3xl flex-1 items-center gap-2 bg-zinc-800 px-0.5 py-3 text-white md:rounded-md md:px-2">
          <button
            className={cx(
              "my-0.5 flex items-center gap-1 rounded-full py-0.5 px-2 text-base font-bold transition-all disabled:opacity-50 disabled:contrast-50 md:px-3 md:text-lg",
              currentlyViewing === "posts"
                ? "bg-zinc-700 text-white"
                : "bg-transparent text-zinc-500 hover:bg-zinc-700"
            )}
            onClick={() => {
              setCurrentlyViewing("posts");
            }}
            disabled={isLoadingPosts}
          >
            Posts
          </button>
          <button
            className={cx(
              "my-0.5 flex items-center gap-1 rounded-full py-0.5 px-2 text-base font-bold transition-all disabled:opacity-50 disabled:contrast-50 md:px-3 md:text-lg",
              currentlyViewing === "comments"
                ? "bg-zinc-700 text-white"
                : "bg-transparent text-zinc-500 hover:bg-zinc-700"
            )}
            onClick={() => {
              setCurrentlyViewing("comments");
            }}
            disabled={isLoadingPosts}
          >
            Comments
          </button>
        </div>
        {currentlyViewing === "posts" &&
          posts.map((p) => (
            <LinkToPost
              key={p.id}
              className="block border-2 border-b-0 border-zinc-600 p-3 last:border-b-2 hover:bg-zinc-800"
              post={{
                ...p,
                community: { ...p.community, moderators: [] },
                user: {
                  bannedUntil: userData.user.bannedUntil,
                  id: userData.user.id,
                  image: userData.user.image,
                  isGlobalMod: userData.user.isGlobalMod,
                  name: userData.user.name,
                },
              }}
            >
              <>
                {" "}
                <h2 className="flex items-center text-lg">
                  {p.title}
                  <BsDot className="text-sm text-zinc-400" />
                  <span className="text-sm text-zinc-400">
                    {timeAgo(p.createdAt)}
                  </span>
                </h2>
                <p className="mt-2 w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-sm text-zinc-400">
                  {p.content}
                </p>
              </>
            </LinkToPost>
          ))}

        {currentlyViewing === "comments" &&
          comments.map((c) => (
            <LinkToPost
              key={c.id}
              className="block border-2 border-b-0 border-zinc-600 p-3 last:border-b-2 hover:bg-zinc-800"
              post={{
                ...c.post,
                community: { ...c.post.community, moderators: [] },
                user: {
                  bannedUntil: userData.user.bannedUntil,
                  id: userData.user.id,
                  image: userData.user.image,
                  isGlobalMod: userData.user.isGlobalMod,
                  name: userData.user.name,
                },
              }}
              commentId={c.id}
            >
              <>
                <h2 className="flex items-center text-lg">
                  {c.post.title}
                  <BsDot className="text-sm text-zinc-400" />
                  <span className="text-sm text-zinc-400">
                    {timeAgo(c.createdAt)}
                  </span>
                </h2>
                <p className="mt-2 w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-sm text-zinc-400">
                  {c.content}
                </p>
              </>
            </LinkToPost>
          ))}
      </div>
      <Loading show={isLoadingPosts} size="large" />
    </>
  );
};

export const banTimeOptions = [
  "1 Minute",
  "1 Hour",
  "12 Hours",
  "1 Day",
  "1 Week",
  "1 Month",
  "Forever",
] as const;
type BanTimeOption = typeof banTimeOptions[number];

const UserModerationDialog: React.FC<{
  userData: FullUser;
  isOpen: boolean;
  close: () => void;
}> = ({ userData, close, isOpen }) => {
  const [banTime, setBanTime] = useState<BanTimeOption>("1 Minute");
  const [reason, setReason] = useState<string>(userData.user.ban?.reason ?? "");
  const isInvalidLength = reason.length > 128;

  const isBanned = new Date(userData.user.bannedUntil) > new Date();

  const utils = trpc.useContext();
  const banUserMutation = trpc.moderator.banUser.useMutation({
    onSuccess: () => {
      utils.user.getUser.invalidate({ userId: userData.user.id });
      close();
    },
  });

  return (
    <Dialog isOpen={isOpen} close={close}>
      <div className="m-auto w-full max-w-sm rounded bg-zinc-800 p-4 pt-0 text-left md:max-w-lg">
        <h2 className="my-4 text-xl">Edit Ban</h2>
        <div className="flex gap-2 overflow-x-scroll p-1">
          {banTimeOptions.map((timeOption) => (
            <button
              key={timeOption}
              className={cx(
                "my-0.5 block w-28 shrink-0 gap-1 rounded-full py-0.5 px-2 text-sm font-bold transition-all disabled:opacity-50 disabled:contrast-50 md:px-3 md:text-base",
                timeOption === banTime
                  ? "bg-zinc-700 text-white"
                  : "bg-transparent text-zinc-500 hover:bg-zinc-700"
              )}
              disabled={banUserMutation.isLoading}
              onClick={() => setBanTime(timeOption)}
            >
              {timeOption}
            </button>
          ))}
        </div>
        <span
          className={cx(
            "mt-3 block overflow-hidden text-sm text-red-500 transition-all",
            isInvalidLength ? "h-5" : "h-0"
          )}
        >
          Reason is too long. Keep it short.
        </span>
        <textarea
          className="my-4 h-40 w-full resize-none overflow-y-scroll rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300 md:h-28"
          placeholder="The reason for the ban"
          onChange={(e) => setReason(e.currentTarget.value)}
        >
          {reason}
        </textarea>

        <Loading show={banUserMutation.isLoading} size="small" />
        <div className="mt-2 flex justify-center gap-3">
          <button
            className="my-2 w-24 rounded-md bg-indigo-800 p-1.5 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
            disabled={isInvalidLength || banUserMutation.isLoading}
            onClick={() =>
              banUserMutation.mutate({
                banTime,
                reason,
                userId: userData.user.id,
              })
            }
          >
            Save
          </button>
          {isBanned && (
            <button
              className="my-2 w-24 rounded-md bg-indigo-800 p-1.5 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
              disabled={isInvalidLength || banUserMutation.isLoading}
              onClick={() =>
                banUserMutation.mutate({
                  banTime: "Not Banned",
                  reason: "",
                  userId: userData.user.id,
                })
              }
            >
              Unban
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

const UserProfileModeration: React.FC<{
  userData: FullUser;
}> = ({ userData }) => {
  const isBanned = new Date(userData.user.bannedUntil) > new Date();
  const session = useSession();
  const isMod = Boolean(session.data?.user?.isGlobalMod);
  const [isOpen, setOpen] = useState<boolean>(false);

  if (!isMod && !isBanned) return null;
  return (
    <div
      className={cx(
        "my-1 mx-auto flex w-full max-w-sm flex-col rounded border-2 border-zinc-500 p-1 md:max-w-md",
        "bg-zinc-800"
      )}
    >
      <div>
        <h2 className="my-4 text-center text-xl">
          {isBanned ? (
            <>
              <BsFillExclamationTriangleFill className="m-1 inline text-lg text-red-500" />
              User has been banned
            </>
          ) : (
            "User is not banned."
          )}
        </h2>
        {isBanned && (
          <>
            <div className="inline-flex w-1/2 flex-col justify-center text-center">
              <span className="text-lg font-bold">
                <BsClock className="m-1 inline align-top" />
                Until
              </span>
              <span>
                {userData.user.bannedUntil?.toLocaleDateString()}{" "}
                {userData.user.bannedUntil?.toLocaleTimeString()}
              </span>
            </div>
            <div className="inline-flex w-1/2 flex-col justify-center text-center">
              <span className="text-lg font-bold">
                <BsFlag className="m-1 inline align-top" />
                For
              </span>
              <span>{userData.user.ban?.reason || "An unknown reason"}</span>
            </div>
          </>
        )}
      </div>

      {isMod && !userData.user.isGlobalMod && (
        <>
          <div className="mt-4">
            <button
              onClick={() => setOpen(true)}
              className="ml-auto block rounded bg-red-900 px-2 py-1 hover:bg-red-800"
            >
              Banning Options
            </button>
          </div>
          <UserModerationDialog
            isOpen={isOpen}
            close={() => setOpen(false)}
            userData={userData}
          />
        </>
      )}
    </div>
  );
};

const UserProfileContent: React.FC<{
  userData: FullUser;
  posts: RouterOutputs["user"]["getUserPosts"]["posts"];
  isLoadingPosts: boolean;
  comments: RouterOutputs["user"]["getUserComments"]["comments"];
  currentlyViewing: "posts" | "comments";
  setCurrentlyViewing: (x: "posts" | "comments") => void;
}> = ({
  userData,
  posts,
  isLoadingPosts,
  comments,
  currentlyViewing,
  setCurrentlyViewing,
}) => {
  return (
    <div className="relative w-full">
      <GoBackButton />
      <UserDataSection userData={userData} />
      <UserProfileModeration userData={userData} />
      <UserProfilePosts
        isLoadingPosts={isLoadingPosts}
        posts={posts}
        comments={comments}
        userData={userData}
        currentlyViewing={currentlyViewing}
        setCurrentlyViewing={setCurrentlyViewing}
      />
    </div>
  );
};
