import type { Community, Post, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Markdown } from "./Markdown";
import { BsDot, BsShare } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { Loading } from "./Loading";
import { Dialog } from "./Dialog";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { useState } from "react";
import { cx, timeAgo } from "../utils/general";

export const PostsViewer: React.FC<{ communityPosts: CommunityPosts }> = ({
  communityPosts,
}) => {
  return (
    <div className="container max-w-3xl">
      {communityPosts.posts.map((post) => (
        <SinglePost key={post.id} post={post} asDialog={false} />
      ))}
      <Loading size="large" show={communityPosts.isLoading} />
    </div>
  );
};

const SinglePost: React.FC<
  {
    post: Post & {
      user: User;
      community: Community;
    };
  } & (
    | {
        asDialog: true;
        close: () => void;
      }
    | { asDialog: false; close?: undefined }
  )
> = ({ post, asDialog, close }) => {
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <>
      {!asDialog && (
        <Dialog isOpen={isOpen} close={() => setOpen(false)}>
          <SinglePost
            post={post}
            asDialog={true}
            close={() => setOpen(false)}
          />
        </Dialog>
      )}
      <div
        className={cx(
          "relative m-4 rounded-md border-[1px] border-transparent bg-zinc-800 p-4 pb-1 text-white",
          asDialog && "container max-w-3xl"
        )}
      >
        {asDialog && (
          <button
            onClick={() => close()}
            className="absolute right-4 top-4 flex items-center gap-1 rounded-xl px-2 py-1 hover:bg-white hover:bg-opacity-10"
          >
            <IoMdClose className="text-2xl" />
            <span className="text-xs">Close</span>
          </button>
        )}
        <div className="flex items-center">
          <Link
            href={`/b/${post.community.name}`}
            className="group flex items-center gap-1 text-sm font-bold"
          >
            <div className="flex h-4 w-4 flex-shrink-0 flex-col items-center justify-center rounded-full border-2 border-zinc-400 bg-indigo-800 text-center text-sm md:h-6 md:w-6">
              {post.community.logo ? (
                <Image
                  src={post.community.logo}
                  alt={`Community logo of ${post.community.name}`}
                  fill
                />
              ) : (
                post.community.name[0]?.toUpperCase()
              )}
            </div>
            <span className="text-gray-300 group-hover:underline">
              b/{post.community.name}
            </span>
          </Link>
          <BsDot className="text-xs text-gray-400" />
          <div className="text-xs text-gray-400">
            Posted by {/* TODO: User profile page */}
            <Link href="/" className="hover:underline">
              u/{post.user.name}
            </Link>
          </div>
          <BsDot className="text-xs text-gray-400" />
          <div className="text-xs text-gray-400">{timeAgo(post.createdAt)}</div>
        </div>
        <h3
          className={cx(
            asDialog
              ? "my-6 text-center text-3xl underline decoration-indigo-600"
              : "my-2 cursor-pointer text-2xl hover:underline"
          )}
          onClick={
            asDialog
              ? undefined
              : () => {
                  setOpen(true);
                }
          }
        >
          {post.title}
        </h3>
        <p className="text-sm text-gray-400">
          <Markdown source={post.content} simplify={!asDialog} />
        </p>
        <hr className="my-2 opacity-50" />
        <div className="flex justify-center">
          <button className="flex flex-col items-center gap-2 py-1 px-2 text-xs hover:bg-zinc-700">
            <BsShare size="18px" />
            Share
          </button>
        </div>
      </div>
    </>
  );
};
