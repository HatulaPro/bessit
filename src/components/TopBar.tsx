import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { AiFillCaretDown, AiFillMeh } from "react-icons/ai";
import { CgComponents } from "react-icons/cg";
import { cx } from "../utils/general";
import { BsSearch } from "react-icons/bs";

export const TopBar: React.FC = () => {
  const session = useSession();

  return (
    <div className="sticky top-0 z-50 flex w-full flex-row-reverse justify-between gap-3 bg-zinc-700 p-2 text-white md:flex-row">
      <div className="hidden md:flex">
        <Link
          href="/"
          className="group relative flex items-center gap-2 pr-4 text-xl active:underline"
        >
          <div className="absolute -z-10 h-12 w-12 rounded-full bg-indigo-600 transition-all group-hover:w-full"></div>
          <Image
            src="/bessit_logo.png"
            alt="Bessit's Logo"
            width={128}
            height={128}
            className="h-12 w-12"
          />
          <span>Bessit</span>
        </Link>
      </div>
      <TopBarSearch />
      <div className="relative flex items-center gap-2 rounded-full border-zinc-500 bg-zinc-800 md:rounded-md md:border-[1px] md:p-1">
        {session.data?.user ? (
          <>
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
          </>
        ) : (
          <button
            className="hidden w-24 bg-zinc-800 p-1 text-center transition-colors hover:bg-zinc-700 md:block"
            onClick={() => signIn()}
          >
            LOG IN
          </button>
        )}
      </div>
    </div>
  );
};

const TopBarSearch: React.FC = () => {
  const [queryInput, setQueryInput] = useState<string>("");
  return (
    <div className="flex w-full items-center rounded-md border-2 border-zinc-500 bg-zinc-800 focus-within:border-zinc-300 md:w-1/3">
      <BsSearch className="mx-2 rounded-full text-xl" />
      <input
        type="text"
        className="w-full bg-transparent p-1 text-lg text-zinc-200 outline-none"
        placeholder="Search Bessit"
        value={queryInput}
        onChange={(e) => setQueryInput(e.currentTarget.value)}
      />
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
        className="hidden h-full px-2 transition-colors hover:bg-zinc-900 md:block"
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
