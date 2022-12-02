import type { Community, Post, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Markdown } from "./Markdown";
import { BsDot, BsShare } from "react-icons/bs";
import { Loading } from "./Loading";
import type { CommunityPosts } from "../hooks/useCommunityPosts";

export const PostsViewer: React.FC<{ communityPosts: CommunityPosts }> = ({
  communityPosts,
}) => {
  return (
    <div className="container max-w-3xl">
      {communityPosts.posts.map((post) => (
        <SinglePost key={post.id} post={post} />
      ))}
      <Loading size="large" show={communityPosts.isLoading} />
    </div>
  );
};

const SinglePost: React.FC<{
  post: Post & {
    user: User;
    community: Community;
  };
}> = ({ post }) => {
  return (
    <div className="m-4 rounded-md bg-zinc-800 p-4 pb-1 text-white">
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
          <span className="group-hover:underline">b/{post.community.name}</span>
        </Link>
        <BsDot className="text-xs text-gray-400" />
        <div className="text-xs text-gray-400">
          Posted by {/* TODO: User profile page */}
          <Link href="/" className="hover:underline">
            u/{post.user.name}
          </Link>
        </div>
      </div>
      <h3 className="text-lg">{post.title}</h3>
      <p className="text-sm text-gray-400">
        <Markdown source={post.content} simplify />
      </p>
      <hr className="my-2 opacity-50" />
      <div className="flex justify-center">
        <button className="flex flex-col items-center gap-2 py-1 px-2 text-xs hover:bg-zinc-700">
          <BsShare size={"18px"} />
          Share
        </button>
      </div>
    </div>
  );
};
