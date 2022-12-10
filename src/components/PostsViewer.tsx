import superjson from "superjson";
import Link from "next/link";
import { Markdown } from "./Markdown";
import { BsChatLeft, BsDot, BsShare } from "react-icons/bs";
import { Loading } from "./Loading";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { cx, slugify, timeAgo } from "../utils/general";
import { PostLikeButton } from "./PostLikeButton";
import { useSession } from "next-auth/react";
import { CommunityLogo } from "./CommunityLogo";

export const PostsViewer: React.FC<{ communityPosts: CommunityPosts }> = ({
  communityPosts,
}) => {
  return (
    <div className="container max-w-3xl">
      {communityPosts.posts.map((post) => (
        <SinglePost key={post.id} post={post} isMain={false} />
      ))}
      <Loading size="large" show={communityPosts.isLoading} />
    </div>
  );
};

const LinkToPost: React.FC<{
  post: CommunityPosts["posts"][number];
  children: JSX.Element;
}> = ({ post, children }) => {
  return (
    <Link
      href={{
        pathname: `/b/${post.community.name}/post/${post.id}/${slugify(
          post.title
        )}`,
        query: { cached_post: superjson.stringify(post) },
      }}
      as={`/b/${post.community.name}/post/${post.id}/${slugify(post.title)}`}
      shallow
    >
      {children}
    </Link>
  );
};

export const SinglePost: React.FC<{
  post: CommunityPosts["posts"][number];
  isMain: boolean;
}> = ({ post, isMain }) => {
  const { status: authStatus } = useSession();
  return (
    <>
      <div
        className={cx(
          "relative my-4 mx-auto rounded-md border-[1px] border-transparent bg-zinc-800 p-4 pb-1 text-white",
          isMain && "container max-w-3xl md:max-w-5xl"
        )}
      >
        <div className="flex items-center">
          <Link
            href={`/b/${post.community.name}`}
            className="group flex items-center gap-1 text-sm font-bold"
          >
            <CommunityLogo
              name={post.community.name}
              logo={post.community.logo}
              size="small"
            />
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
        {isMain ? (
          <h3
            className={
              "my-6 text-center text-3xl underline decoration-indigo-600"
            }
          >
            {post.title}
          </h3>
        ) : (
          <LinkToPost post={post}>
            <h3 className={"my-2 cursor-pointer text-2xl hover:underline"}>
              {post.title}
            </h3>
          </LinkToPost>
        )}
        <div className="text-sm text-gray-400">
          <Markdown source={post.content} simplify={!isMain} />
        </div>
        <hr className="my-2 opacity-50" />
        <div className="mx-auto flex max-w-md justify-evenly pb-2">
          <button className="p-2 text-zinc-400 hover:text-emerald-400">
            <BsShare className="text-xl" />
          </button>
          <PostLikeButton
            post={post}
            loggedIn={authStatus === "authenticated"}
          />
          <LinkToPost post={post}>
            <button className="text-md flex items-center gap-1.5 p-2 text-zinc-400 hover:text-blue-500">
              <BsChatLeft className="text-2xl" />
              {post._count.comments}
            </button>
          </LinkToPost>
        </div>
      </div>
    </>
  );
};
