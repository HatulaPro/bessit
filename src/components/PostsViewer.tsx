import {
  BsArrowCounterclockwise,
  BsChatLeft,
  BsDot,
  BsEyeSlashFill,
  BsFillExclamationTriangleFill,
  BsFillShieldFill,
  BsPencil,
  BsShare,
  BsThreeDotsVertical,
  BsTrashFill,
} from "react-icons/bs";
import { Loading } from "./Loading";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { cx, slugify, timeAgo } from "../utils/general";
import { PostLikeButton } from "./PostLikeButton";
import { useSession } from "next-auth/react";
import { CommunityLogo } from "./CommunityLogo";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import { trpc } from "../utils/trpc";
import { UserProfileLink } from "./UserProfileLink";
import { useRouter } from "next/router";
import { NotBannedOnlyButton } from "./NotBannedOnlyButton";
import dynamic from "next/dynamic";
import { LinkToCommunity } from "./LinkToCommunity";
import { LinkToPost } from "./LinkToPost";
import { useCommunityRedirect, usePostRedirect } from "../hooks/useRedirects";

const Markdown = dynamic(() => import("./Markdown").then((x) => x.Markdown));
const EditPostForm = dynamic(() =>
  import("./EditPostForm").then((x) => x.EditPostForm)
);

export const PostsViewer: React.FC<{ communityPosts: CommunityPosts }> = ({
  communityPosts,
}) => {
  return (
    <div className="container max-w-3xl">
      {communityPosts.posts.map((post) => (
        <SinglePost
          key={post.id}
          post={post}
          isMain={false}
          placeholder={
            communityPosts.isLoading && communityPosts.posts.length === 0
          }
        />
      ))}
      <br />
      <Loading size="large" show={communityPosts.isLoading} />
      <br />
    </div>
  );
};

export const SinglePost: React.FC<{
  post: CommunityPosts["posts"][number];
  isMain: boolean;
  placeholder?: boolean;
}> = ({ post, isMain, placeholder }) => {
  const session = useSession();

  const showModeratorTools = useMemo<boolean>(() => {
    if (placeholder) return false;
    if (!isMain) return false;
    if (session.status !== "authenticated" || !session.data?.user) return false;
    const uid = session.data.user.id;
    if (session.data.user.isGlobalMod) return true;
    if (uid === post.community.ownerId) return true;
    for (let i = 0; i < post.community.moderators.length; ++i) {
      if (uid === post.community.moderators[i]?.userId) return true;
    }
    return false;
  }, [post.community, isMain, placeholder, session.data?.user, session.status]);

  const isPosterModerator = useMemo<boolean>(() => {
    if (placeholder) return false;
    if (!isMain) return false;
    if (post.user.isGlobalMod) return true;
    const uid = post.userId;
    if (uid === post.community.ownerId) return true;
    for (let i = 0; i < post.community.moderators.length; ++i) {
      if (uid === post.community.moderators[i]?.userId) return true;
    }
    return false;
  }, [post.community, post.userId, post.user, isMain, placeholder]);

  return (
    <>
      <div
        className={cx(
          "relative my-4 mx-auto rounded-md border-[1px] border-transparent bg-zinc-800 p-4 pb-1 text-white",
          isMain ? "container max-w-3xl md:max-w-5xl" : "come-from-bottom"
        )}
      >
        <LinkToCommunity
          community={post.community}
          className="group flex w-min items-center gap-1 text-sm font-bold"
        >
          <>
            <CommunityLogo
              name={post.community.name}
              logo={post.community.logo}
              size="small"
            />
            <span
              className={cx(
                "text-gray-300 group-hover:underline",
                placeholder && "min-w-0 animate-pulse rounded bg-zinc-600"
              )}
            >
              b/{post.community.name}
            </span>
          </>
        </LinkToCommunity>
        <div className="flex items-center pl-0 sm:pl-6">
          <div className="text-xs text-gray-400">
            Posted by{" "}
            <UserProfileLink
              user={post.user}
              className={cx(
                placeholder &&
                  "inline-block min-w-0 animate-pulse rounded bg-zinc-600"
              )}
            />
            {isPosterModerator && (
              <BsFillShieldFill
                className={cx(
                  "ml-1.5 mb-0.5 inline-block",
                  post.user.isGlobalMod ? "text-green-600" : "text-indigo-600"
                )}
              />
            )}
          </div>
          <BsDot className="text-xs text-gray-400" />
          <div className="text-xs text-gray-400">{timeAgo(post.createdAt)}</div>
          {isMain && post.updatedAt.getTime() !== post.createdAt.getTime() && (
            <div className="mx-1 text-xs text-gray-400">
              (edited {timeAgo(post.updatedAt)} ago)
            </div>
          )}
        </div>
        {isMain ? (
          <>
            <h3
              className={cx(
                "my-6 text-center text-2xl underline decoration-indigo-600 md:text-3xl",
                placeholder &&
                  !post.title &&
                  "w-full animate-pulse rounded bg-zinc-600"
              )}
            >
              {post.title || "..."}
            </h3>
            {showModeratorTools && <PostModeratorTools post={post} />}
          </>
        ) : (
          <LinkToPost post={post}>
            <h3
              className={cx(
                "my-2 cursor-pointer text-2xl hover:underline",
                placeholder &&
                  !post.title &&
                  "w-full animate-pulse rounded bg-zinc-600"
              )}
            >
              {post.title || "..."}
            </h3>
          </LinkToPost>
        )}
        <div className="text-sm text-gray-400">
          {placeholder && !post.content ? (
            <p className="h-16 w-full animate-pulse bg-zinc-600">
              {post.content}
            </p>
          ) : (
            <Markdown source={post.content} simplify={!isMain} />
          )}
        </div>
        <hr className="my-2 opacity-50" />
        {post.isDeleted ? (
          <div className="flex items-center justify-center gap-2 p-1 text-base text-zinc-200">
            <BsFillExclamationTriangleFill className="text-red-500" />
            This post has been erased from the public eye.
          </div>
        ) : (
          <div className="mx-auto flex max-w-md justify-evenly pb-2">
            <button
              className="p-2 text-zinc-400 hover:text-emerald-400"
              onClick={() => {
                if (typeof navigator !== undefined && navigator.share) {
                  navigator.share({
                    text: `View this fantastic Bessit post by /u/${post.user.name}!`,
                    url: `${document.location.origin}/b/${
                      post.community.name
                    }/post/${post.id}/${slugify(post.title)}`,
                    title: post.title,
                  });
                }
              }}
            >
              <BsShare className="text-xl" />
            </button>
            <PostLikeButton post={post} userId={session.data?.user?.id} />
            <LinkToPost
              className="text-md flex items-center gap-1.5 p-2 text-zinc-400 hover:text-blue-500"
              post={post}
            >
              <>
                <BsChatLeft className="text-2xl" />
                {post._count.comments}
              </>
            </LinkToPost>
            {session.data?.user?.id === post.userId && isMain && (
              <EditPostButton post={post} />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export const PostModeratorTools: React.FC<{
  post: CommunityPosts["posts"][number];
  comment?: { isDeleted: boolean; id: string };
}> = ({ post, comment }) => {
  const router = useRouter();
  const [isOpen, setOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const session = useSession();
  const isGlobalMod = Boolean(session.data?.user?.isGlobalMod);

  const postRedirect = usePostRedirect();
  const communityRedirect = useCommunityRedirect();
  const utils = trpc.useContext();
  const deletePostMutation = trpc.moderator.setPostDeleted.useMutation({
    onSuccess: (data) => {
      utils.post.getPosts.invalidate();
      utils.post.getPost.setData({ post_id: data.id }, () => {
        return { ...post, isDeleted: data.isDeleted };
      });
    },
  });

  const deleteCommentMutation = trpc.moderator.setCommentDeleted.useMutation({
    onSuccess: (data) => {
      utils.post.getComments.invalidate();
      postRedirect(post, data);
    },
  });

  const nukePostMutation = trpc.moderator.nukePost.useMutation({
    onSuccess: () => {
      utils.post.getPosts.invalidate();
      utils.post.getPost.setData({ post_id: post.id }, () => {
        return undefined;
      });
      communityRedirect(post.community);
    },
  });

  const nukeCommentMutation = trpc.moderator.nukeComment.useMutation({
    onSuccess: () => {
      utils.post.getComments.invalidate();
      router.push(
        `/b/${post.community.name}/post/${post.id}/${slugify(post.title)}`
      );
    },
  });

  const isLoading =
    deletePostMutation.isLoading ||
    deleteCommentMutation.isLoading ||
    nukePostMutation.isLoading ||
    nukeCommentMutation.isLoading;

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!isOpen) return;
      if (!e.target || !menuRef.current || !buttonRef.current) return;
      if (
        !menuRef.current.contains(e.target as Node) &&
        e.target !== menuRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        e.target !== buttonRef.current
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [menuRef, buttonRef, isOpen, setOpen]);

  return (
    <div className="absolute top-3 right-3 text-white">
      <button
        ref={buttonRef}
        className="text-xl"
        onClick={() => setOpen(!isOpen)}
      >
        {isLoading ? <Loading size="small" show /> : <BsThreeDotsVertical />}
      </button>
      <div
        className={cx(
          "absolute right-full -top-4 flex w-32 origin-right translate-y-full flex-col rounded bg-zinc-900 p-1 text-sm transition-transform duration-75",
          isOpen ? "scale-x-100" : "scale-x-0"
        )}
        ref={menuRef}
      >
        {(comment ? comment.isDeleted : post.isDeleted) ? (
          <button
            onClick={() => {
              if (comment) {
                deleteCommentMutation.mutate({
                  commentId: comment.id,
                  newDeletedStatus: false,
                });
              } else {
                deletePostMutation.mutate({
                  postId: post.id,
                  newDeletedStatus: false,
                });
              }
              setOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded p-1 transition-colors hover:bg-zinc-700"
          >
            <BsArrowCounterclockwise className="text-green-500" /> Restore{" "}
            {comment ? "Comment" : "Post"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (comment) {
                deleteCommentMutation.mutate({
                  commentId: comment.id,
                  newDeletedStatus: true,
                });
              } else {
                deletePostMutation.mutate({
                  postId: post.id,
                  newDeletedStatus: true,
                });
              }
              setOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded p-1 transition-colors hover:bg-zinc-700"
          >
            <BsEyeSlashFill className="text-white" /> Hide{" "}
            {comment ? "Comment" : "Post"}
          </button>
        )}
        {isGlobalMod && (
          <button
            onClick={() => {
              if (comment) {
                nukeCommentMutation.mutate({
                  commentId: comment.id,
                });
              } else {
                nukePostMutation.mutate({
                  postId: post.id,
                });
              }
              setOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 rounded p-1 transition-colors hover:bg-zinc-700"
          >
            <BsTrashFill className="text-red-500" /> Nuke{" "}
            {comment ? "Comment" : "Post"}
          </button>
        )}{" "}
      </div>
    </div>
  );
};

const EditPostButton: React.FC<{ post: CommunityPosts["posts"][number] }> = ({
  post,
}) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <>
      <NotBannedOnlyButton
        onClick={() => setOpen(true)}
        Child={(props) => (
          <button {...props} className="p-2 text-zinc-400 hover:text-white">
            <BsPencil className="text-xl" />
          </button>
        )}
      />
      <Dialog close={() => setOpen(false)} isOpen={isOpen}>
        <EditPostForm post={post} close={() => setOpen(false)} />
      </Dialog>
    </>
  );
};
