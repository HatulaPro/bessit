import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useMemo } from "react";
import { AiFillMeh } from "react-icons/ai";
import { BsDot, BsSuitHeartFill } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { z } from "zod";
import { Loading } from "../../components/Loading";
import { NotFoundMessage } from "../../components/NotFoundMessage";
import { cx, slugify, timeAgo } from "../../utils/general";
import { type RouterOutputs, trpc } from "../../utils/trpc";

const ProfilePage: NextPage = () => {
  const {
    user,
    isLoadingUser: isLoading,
    is404,
    posts,
    isLoadingPosts,
  } = useUserProfileData();
  const pageTitle = `Bessit | ${user?.name || "User Profile"}`;

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
        ) : user ? (
          <UserProfileContent
            isLoadingPosts={isLoadingPosts}
            user={user}
            posts={posts}
          />
        ) : (
          <Loading size="large" show />
        )}
      </main>
    </>
  );
};

export default ProfilePage;

const userDataQuerySchema = z.object({
  user_data: z.array(z.string()).length(2),
});
const useUserProfileData = () => {
  const router = useRouter();
  const zodParsing = userDataQuerySchema.safeParse(router.query);
  const queryData = zodParsing.success ? zodParsing.data : undefined;

  const getUserQuery = trpc.user.getUser.useQuery(
    { userId: queryData?.user_data[0] ?? "NOT_SENDABLE" },
    {
      enabled: Boolean(queryData),
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      retry: false,
      onError: () => {
        router.push("/");
      },
    }
  );

  const getUserPostsQuery = trpc.user.getUserPosts.useInfiniteQuery(
    { userId: queryData?.user_data[0] ?? "NOT_SENDABLE", count: 5 },
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
    const listener = () => {
      if (
        getUserPostsQuery.isLoading ||
        getUserPostsQuery.isFetchingNextPage ||
        !getUserPostsQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 800 >
        document.body.offsetHeight
      ) {
        getUserPostsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [getUserPostsQuery]);

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

  return {
    is404: !getUserQuery.isLoading && !getUserQuery.data,
    user: getUserQuery.data || null,
    isLoadingUser: getUserQuery.isLoading,
    isLoadingPosts: getUserPostsQuery.isLoading || getUserPostsQuery.isFetching,
    posts: flattenedUserPosts,
  };
};

type FullUser = Exclude<RouterOutputs["user"]["getUser"], null>;

const UserDataSection: React.FC<{
  user: FullUser;
}> = ({ user }) => {
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

  return (
    <div className="container relative mx-auto my-4 max-w-sm rounded border-2 border-zinc-500 bg-zinc-800 p-3 md:max-w-md">
      <div className="absolute inset-0 h-32 w-full bg-indigo-700"></div>
      <div className="relative flex-col justify-center text-center">
        {user.image ? (
          <Image
            className="mx-auto rounded-md"
            loader={({ src }) => src}
            src={user.image}
            alt="Profile Image"
            width={112}
            height={112}
          />
        ) : (
          <AiFillMeh className="mx-auto h-28 w-28 rounded-md bg-zinc-600 bg-opacity-60" />
        )}
        <h1 className="my-1 text-2xl">
          <span
            className={cx(
              "inline-block h-4 w-4 rounded-full",
              user._count.sessions
                ? "bg-green-500"
                : "border-2 border-zinc-500 bg-zinc-600"
            )}
          ></span>{" "}
          u/{user.name}
        </h1>
        <div className="mt-4 flex w-full justify-evenly">
          <div className="flex flex-col text-center">
            <span>Post Likes</span>
            <span>
              <BsSuitHeartFill className="mr-1.5 inline-block text-red-500" />
              {user._count.postVotes}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span> Comment Likes</span>
            <span>
              <BsSuitHeartFill className="mr-1.5 inline-block text-red-500" />
              {user._count.commentVotes}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col">
        <span>
          <span className="text-lg font-bold underline decoration-indigo-500">
            #{user._count.posts}
          </span>{" "}
          {randomlyGeneratedGoodAdjective()} Posts
        </span>
        <span>
          <span className="text-lg font-bold underline decoration-indigo-500">
            #{user._count.comment}
          </span>{" "}
          {randomlyGeneratedGoodAdjective()} Comments
        </span>
      </div>
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
  posts: RouterOutputs["user"]["getUserPosts"]["posts"];
  isLoadingPosts: boolean;
}> = ({ posts, isLoadingPosts }) => {
  return (
    <>
      <div className="my-1 mx-auto flex w-full max-w-sm flex-col md:max-w-md">
        {posts.map((p) => (
          <Link
            key={p.id}
            className="block border-2 border-b-0 border-zinc-600 p-3 last:border-b-2 hover:bg-zinc-800"
            href={`/b/${p.community.name}/post/${p.id}/${slugify(p.title)}`}
          >
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
          </Link>
        ))}
      </div>
      <Loading show={isLoadingPosts} size="large" />
    </>
  );
};

const UserProfileContent: React.FC<{
  user: FullUser;
  posts: RouterOutputs["user"]["getUserPosts"]["posts"];
  isLoadingPosts: boolean;
}> = ({ user, posts, isLoadingPosts }) => {
  return (
    <div className="relative w-full">
      <GoBackButton />
      <UserDataSection user={user} />
      <UserProfilePosts isLoadingPosts={isLoadingPosts} posts={posts} />
    </div>
  );
};
