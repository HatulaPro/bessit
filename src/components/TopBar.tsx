import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { AiFillCaretDown, AiFillMeh } from "react-icons/ai";
import { CgComponents } from "react-icons/cg";
import { cx, slugify, timeAgo } from "../utils/general";
import {
  BsArrowRepeat,
  BsBell,
  BsChatLeft,
  BsDot,
  BsSearch,
  BsXLg,
} from "react-icons/bs";
import { useDebounce } from "../hooks/useDebounce";
import { trpc } from "../utils/trpc";
import { CommunityLogo } from "./CommunityLogo";
import { useRouter } from "next/router";
import { Dialog } from "./Dialog";
import { Loading } from "./Loading";

export const TopBar: React.FC = () => {
  const session = useSession();
  const [searchBarOpen, setSearchBarOpen] = useState<boolean>(false);

  return (
    <div
      className={cx(
        "fixed top-0 z-50 flex w-full flex-row-reverse justify-between bg-zinc-700 p-2 text-white md:flex-row",
        searchBarOpen ? "gap-0 md:gap-3" : "gap-3"
      )}
    >
      <div
        className={cx(
          "flex transition-all md:flex-1",
          searchBarOpen ? "shrink" : "shrink-0"
        )}
      >
        <Link
          href="/"
          className="group relative flex items-center gap-2 text-xl decoration-indigo-500 hover:underline active:text-gray-300 md:pr-4"
        >
          <Image
            src="/bessit_logo.png"
            alt="Bessit's Logo"
            width={128}
            height={128}
            className="h-8 w-8 md:h-12 md:w-12"
          />
          <span className="hidden md:block">Bessit</span>
        </Link>
      </div>
      <TopBarSearch open={searchBarOpen} setOpen={setSearchBarOpen} />
      <div
        className={cx(
          "flex flex-row-reverse items-center justify-between gap-2 md:flex-1 md:flex-row",
          searchBarOpen ? "shrink md:shrink-0" : "shrink-0"
        )}
      >
        {session.data?.user ? (
          <>
            <TopBarNotificationsDialog searchBarOpen={searchBarOpen} />
            <div
              className={cx(
                "relative flex items-center gap-2 rounded-full border-zinc-500 bg-zinc-800 md:rounded-md md:border-[1px] md:p-1",
                searchBarOpen ? "shrink md:shrink-0" : "shrink-0"
              )}
            >
              {session.data.user.image ? (
                <Image
                  className="rounded-full"
                  loader={({ src }) => src}
                  src={session.data.user.image}
                  alt="Profile Image"
                  width={36}
                  height={36}
                />
              ) : (
                <AiFillMeh className="h-9 w-9 rounded-full" />
              )}
              <span className="hidden text-lg md:block">
                {session.data.user.name}
              </span>
              <TopBarUserMenu />
            </div>
          </>
        ) : (
          <button
            className="m-1 ml-auto hidden w-24 rounded-lg border-[1px] border-zinc-500 bg-zinc-800 p-1 text-center transition-colors hover:bg-zinc-900 md:block md:rounded-md"
            onClick={() => signIn()}
          >
            Log In
          </button>
        )}
      </div>
    </div>
  );
};

const TopBarNotificationsDialog: React.FC<{ searchBarOpen: boolean }> = ({
  searchBarOpen,
}) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const onRouteChanged = () => {
      setOpen(false);
    };
    router.events.on("routeChangeStart", onRouteChanged);

    return () => {
      router.events.off("routeChangeStart", onRouteChanged);
    };
  }, [router, setOpen]);

  const getNotificationsQuery =
    trpc.notification.getNotifications.useInfiniteQuery(
      { count: 4 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        cacheTime: Infinity,
        staleTime: Infinity,
        retry: 0,
        notifyOnChangeProps: "all",
        keepPreviousData: true,
      }
    );

  const flattenedNotifications = useMemo(() => {
    return (
      getNotificationsQuery.data?.pages.reduce<
        typeof getNotificationsQuery["data"]["pages"][number]["notifications"]
      >((acc, cur) => {
        acc.push(...cur.notifications);
        return acc;
      }, []) || []
    );
  }, [getNotificationsQuery]);

  const utils = trpc.useContext();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cx(
          "group relative mr-auto rounded-md bg-zinc-800 p-1.5 text-2xl",
          searchBarOpen ? "hidden md:block" : "block"
        )}
      >
        <BsBell className="group-hover:animate-wiggle" />
        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-zinc-800 bg-indigo-600 group-hover:opacity-0"></span>
      </button>
      <Dialog isOpen={isOpen} close={() => setOpen(false)}>
        <div className="m-auto max-h-72 w-full max-w-xs overflow-y-scroll rounded bg-zinc-800 p-2 pt-0 text-left md:max-w-sm">
          <h2 className="sticky top-0 mb-4 flex justify-between border-b-2 border-zinc-700 bg-zinc-800 px-2 py-4 text-sm text-zinc-300">
            {/* TODO: Show the number of unread notifications here */}
            Notifications
            <button
              className={cx(
                "rounded-full p-1 text-lg transition-colors enabled:hover:bg-white enabled:hover:bg-opacity-25 disabled:animate-spin"
              )}
              onClick={() => utils.notification.getNotifications.invalidate()}
              disabled={
                getNotificationsQuery.isLoading ||
                getNotificationsQuery.isFetching
              }
            >
              <BsArrowRepeat />
            </button>
          </h2>
          {flattenedNotifications.map((notification) => (
            <button
              key={notification.id}
              className="block w-full rounded-md bg-zinc-800 px-3 py-4 text-left hover:bg-zinc-900"
              onClick={() => {
                // TODO: set notification as seen
                router.push(
                  `/b/${notification.relatedPost.community.name}/post/${
                    notification.relatedPostId
                  }/${slugify(notification.relatedPost.title)}${
                    notification.newCommentId
                      ? "/" + notification.newCommentId
                      : ""
                  }`
                );
              }}
            >
              {notification.type === "COMMENT_ON_POST" ? (
                <>
                  <h3
                    className={cx("text-sm", !notification.seen && "font-bold")}
                  >
                    <i>{notification.newComment?.user.name}</i> replied to your
                    post: <i>{notification.relatedPost.title}</i>
                    <span className="pl-2 text-xs font-thin text-zinc-400">
                      {timeAgo(notification.updatedAt)}
                    </span>
                  </h3>
                  <p className="mt-2 w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-zinc-400">
                    <BsChatLeft className="m-1 inline-block text-blue-500" />
                    {notification.newComment?.content}
                  </p>
                </>
              ) : notification.type === "COMMENT_ON_COMMENT" ? (
                <>
                  <h3
                    className={cx("text-sm", !notification.seen && "font-bold")}
                  >
                    <i>{notification.newComment?.user.name}</i> replied to your
                    comment on: <i>{notification.relatedPost.title}</i>
                    <span className="pl-2 text-xs font-thin text-zinc-400">
                      {timeAgo(notification.updatedAt)}
                    </span>
                  </h3>
                  <p className="mt-2 w-full overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-zinc-400">
                    <BsChatLeft className="m-1 inline-block text-blue-500" />
                    {notification.newComment?.content}
                  </p>
                </>
              ) : notification.type === "LIKES_ON_POST" ? (
                <>likes on post</>
              ) : notification.type === "LIKES_ON_COMMENT" ? (
                <>likes on com</>
              ) : (
                <>Unreachable</>
              )}
            </button>
          ))}
          {getNotificationsQuery.hasNextPage && (
            <button
              disabled={
                getNotificationsQuery.isLoading ||
                getNotificationsQuery.isFetching
              }
              className="mx-auto mt-2 block rounded-md bg-indigo-800 p-1.5 text-sm text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
              onClick={() => getNotificationsQuery.fetchNextPage()}
            >
              Load More
              <Loading
                show={
                  getNotificationsQuery.isLoading ||
                  getNotificationsQuery.isFetching
                }
                size="small"
              />
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
};

const TopBarSearch: React.FC<{
  open: boolean;
  setOpen: (isOpen: boolean) => void;
}> = ({ open, setOpen }) => {
  const [queryInput, setQueryInput] = useState<string>("");
  const debouncedQueryInput = useDebounce(queryInput, 500);
  const firstUserRef = useRef<HTMLDivElement>(null);
  const firstCommunityRef = useRef<HTMLDivElement>(null);
  const searchQueryInputRef = useRef<HTMLInputElement>(null);

  const searchQuery = trpc.search.search.useQuery(
    { q: debouncedQueryInput },
    {
      enabled: debouncedQueryInput.length > 0,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      cacheTime: Infinity,
      staleTime: Infinity,
      keepPreviousData: true,
    }
  );
  const router = useRouter();

  function onKeyDown(link: string, nextQueryInput: string) {
    return (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowUp") {
        let next = e.currentTarget.previousElementSibling;
        while (next && next?.tagName !== "DIV")
          next = next.previousElementSibling;

        if (!next) {
          searchQueryInputRef.current?.focus();
        } else {
          (next as HTMLDivElement).focus();
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        let next = e.currentTarget.nextElementSibling;
        while (next && next?.tagName !== "DIV") next = next.nextElementSibling;

        if (!next) {
          searchQueryInputRef.current?.focus();
        } else {
          (next as HTMLDivElement).focus();
        }
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        setQueryInput(nextQueryInput);
        e.currentTarget.blur();
        router.push(link);
        e.preventDefault();
      } else if (e.key === "Escape") {
        e.currentTarget.blur();
        e.preventDefault();
      }
    };
  }

  return (
    <div
      onBlur={(e) => {
        if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
        }
      }}
      className={cx(
        "relative flex w-full items-center rounded-md border-2 border-zinc-500 bg-zinc-800 transition-all focus-within:rounded-b-none focus-within:border-zinc-300 md:w-1/3",
        open && "shrink-0 md:shrink"
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center text-center text-xl">
        <BsSearch />
      </div>
      <input
        type="text"
        className="h-full w-full bg-transparent p-1 text-xl text-zinc-200 outline-none"
        placeholder="Search Bessit"
        value={queryInput}
        onChange={(e) => setQueryInput(e.currentTarget.value)}
        tabIndex={9}
        autoComplete="off"
        onKeyDown={(e) => {
          const focusAt =
            firstUserRef.current || firstCommunityRef.current || null;

          if (!focusAt) return;
          if (e.key === "ArrowDown") {
            focusAt.focus();
            e.preventDefault();
          } else if (e.key === "ArrowUp") {
            (
              focusAt.parentElement?.children[
                focusAt.parentElement.children.length - 1
              ] as HTMLDivElement
            ).focus();
            e.preventDefault();
          }
        }}
        ref={searchQueryInputRef}
        onFocus={() => {
          setOpen(true);
          setTimeout(() => {
            (
              searchQueryInputRef.current?.parentElement as HTMLDivElement
            ).scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }, 400);
        }}
      />
      <button
        className={cx(
          "h-8 shrink-0 overflow-hidden rounded-full bg-white bg-opacity-0 text-center transition-all hover:bg-opacity-20",
          queryInput.length === 0 ? "w-0" : "w-8"
        )}
        onClick={() => {
          setQueryInput("");
          searchQueryInputRef.current?.focus();
        }}
      >
        <BsXLg className="m-auto text-lg" />
      </button>

      <div
        className={cx(
          "absolute top-full w-full origin-top overflow-hidden rounded-b-sm bg-zinc-800 transition-all",
          open ? "px-1" : "scale-y-0 px-0",
          ((searchQuery.data?.users && searchQuery.data?.users.length > 0) ||
            (searchQuery.data?.communities &&
              searchQuery.data?.communities.length > 0)) &&
            (open ? "py-1" : "")
        )}
      >
        {searchQuery.data?.users && searchQuery.data.users.length > 0 && (
          <>
            <h3 className="p-2 text-xl font-bold">Users</h3>
            {searchQuery.data.users.map((user, index) => (
              <div
                className="flex cursor-pointer items-center gap-1 rounded px-2 py-0.5 outline-none transition-colors hover:bg-zinc-900 focus:bg-black"
                key={user.id}
                tabIndex={index + 10}
                ref={index === 0 ? firstUserRef : undefined}
                onClick={(e) => {
                  router.push("/");
                  setQueryInput(`/u/${user.name}`);
                  e.currentTarget.blur();
                }}
                onKeyDown={onKeyDown("/", `/u/${user.name}`)}
              >
                {user.image ? (
                  <Image
                    className="rounded-full"
                    loader={({ src }) => src}
                    src={user.image}
                    alt="Profile Image"
                    width={28}
                    height={28}
                  />
                ) : (
                  <AiFillMeh className="h-7 w-7 rounded-full" />
                )}
                {user.name}
              </div>
            ))}
          </>
        )}
        {searchQuery.data?.communities &&
          searchQuery.data.communities.length > 0 && (
            <>
              <h3 className="p-2 text-xl font-bold">Communities</h3>
              {searchQuery.data.communities.map((community, index) => (
                <div
                  className="flex cursor-pointer items-center gap-1 rounded px-2 py-1 outline-none transition-colors hover:bg-zinc-900 focus:bg-black"
                  key={community.id}
                  onClick={(e) => {
                    router.push(`/b/${community.name}`);
                    setQueryInput(`/b/${community.name}`);
                    e.currentTarget.blur();
                  }}
                  tabIndex={index + (searchQuery.data.users?.length || 0) + 10}
                  ref={index === 0 ? firstCommunityRef : undefined}
                  onKeyDown={onKeyDown(
                    `/b/${community.name}`,
                    `/b/${community.name}`
                  )}
                >
                  <CommunityLogo
                    name={community.name}
                    logo={community.logo}
                    size="small"
                  />
                  <span>/b/{community.name}</span>
                  <BsDot className="shrink-0 text-gray-400" />
                  <span className="overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-gray-400">
                    {community.desc}
                  </span>
                </div>
              ))}
            </>
          )}
      </div>
    </div>
  );
};

const TopBarUserMenu: React.FC = () => {
  const [isMenuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!isMenuOpen) return;
      if (!e.target || !menuRef.current || !buttonRef.current) return;
      if (
        !menuRef.current.contains(e.target as Node) &&
        e.target !== menuRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        e.target !== buttonRef.current
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [menuRef, isMenuOpen, setMenuOpen]);

  return (
    <>
      <button
        className="hidden h-8 px-2 transition-colors hover:bg-zinc-900 md:block"
        onClick={() => setMenuOpen((prev) => !prev)}
        ref={buttonRef}
      >
        <AiFillCaretDown
          className={cx("transition-transform", isMenuOpen && "rotate-90")}
        />
      </button>
      <div
        className={cx(
          "absolute bottom-0 -m-1 flex w-full origin-right translate-y-full flex-col rounded bg-zinc-800 p-1 transition-transform duration-75",
          isMenuOpen ? "scale-x-full" : "scale-x-0"
        )}
        ref={menuRef}
      >
        <button
          className="p-1 transition-colors hover:bg-zinc-700"
          onClick={() => signOut()}
        >
          log out
        </button>
        <hr className="m-1" />
        <Link
          href="/create_community"
          className="flex items-center justify-center gap-2 p-1 transition-colors hover:bg-zinc-700"
        >
          <CgComponents /> new community
        </Link>
      </div>
    </>
  );
};
