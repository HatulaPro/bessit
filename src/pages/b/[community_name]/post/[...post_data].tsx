import type { CommentVote, User } from "@prisma/client";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { z } from "zod";
import { Loading } from "../../../../components/Loading";
import { NotFoundMessage } from "../../../../components/NotFoundMessage";
import {
  PostModeratorTools,
  SinglePost,
} from "../../../../components/PostsViewer";
import { type RouterOutputs, trpc } from "../../../../utils/trpc";
import superjson from "superjson";
import { IoMdClose } from "react-icons/io";
import type { CommunityPosts } from "../../../../hooks/useCommunityPosts";
import { cx, slugify, timeAgo } from "../../../../utils/general";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BsDot,
  BsChatLeft,
  BsShare,
  BsArrowUpCircle,
  BsPencil,
  BsFillExclamationTriangleFill,
  BsFillShieldFill,
} from "react-icons/bs";
import Image from "next/image";
import { CommentLikeButton } from "../../../../components/CommentLikeButton";
import { LoggedOnlyButton } from "../../../../components/LoggedOnlyButton";
import type { InfiniteData } from "@tanstack/react-query";
import { UserProfileLink } from "../../../../components/UserProfileLink";
import { AiFillMeh } from "react-icons/ai";
import { NotBannedOnlyButton } from "../../../../components/NotBannedOnlyButton";
import dynamic from "next/dynamic";

const Markdown = dynamic(() =>
  import("../../../../components/Markdown").then((x) => x.Markdown)
);

const CreateCommentForm = dynamic(() =>
  import("../../../../components/CreateCommentForm").then(
    (x) => x.CreateCommentForm
  )
);

const PostPage: NextPage = () => {
  const postTopRef = useRef<HTMLDivElement>(null);
  const {
    post,
    isLoading,
    is404,
    comments,
    currentMainCommentId: currentParentCommentId,
    setCurrentMainCommentId: setCurrentParentCommentId,
  } = useCachedPost(postTopRef.current);
  const pageTitle = `Bessit | ${post?.title || "View Post"}`;
  const router = useRouter();
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="View a post on the Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex min-h-full w-full flex-col items-center bg-zinc-900 pt-12 pb-2 text-white md:pt-16">
        {is404 && (
          <NotFoundMessage message="This post does not seem to exist" />
        )}
        {post && (
          <PostPageContent
            setCurrentParentCommentId={setCurrentParentCommentId}
            currentParentCommentId={currentParentCommentId}
            comments={comments}
            post={post}
            isLoadingComments={isLoading.comments}
            placeholder={isLoading.post}
          />
        )}
        <div
          className="absolute m-auto h-0 w-0 bg-black"
          ref={postTopRef}
        ></div>

        <button
          onClick={() => {
            router.back();
          }}
          className="absolute right-12 top-20 hidden items-center gap-1 rounded-xl px-2 py-1 text-white hover:bg-white hover:bg-opacity-10 md:flex"
        >
          <IoMdClose className="text-2xl" />
          <span className="text-sm">Back</span>
        </button>
      </main>
    </>
  );
};

export default PostPage;

const PostPageContent: React.FC<{
  post: CommunityPosts["posts"][number];
  comments: ReturnType<typeof useCachedPost>["comments"];
  setCurrentParentCommentId: (x: string | null) => void;
  currentParentCommentId: string | null;
  isLoadingComments: boolean;
  placeholder: boolean;
}> = ({
  post,
  comments,
  setCurrentParentCommentId,
  currentParentCommentId,
  isLoadingComments,
  placeholder,
}) => {
  const { status: authStatus } = useSession();
  const [editCommentOptions, setEditCommentOptions] = useState<{
    commentId: string | null;
    editOrCreate: "edit" | "create";
  }>({ commentId: null, editOrCreate: "create" });

  return (
    <div className="w-full">
      <SinglePost placeholder={placeholder} post={post} isMain={true} />
      {currentParentCommentId !== null && (
        <button
          className="text-md m-2 mx-auto flex flex-col items-center justify-center gap-2 text-center hover:underline"
          onClick={() => setCurrentParentCommentId(null)}
        >
          <BsArrowUpCircle className="text-2xl" />
          Back to main thread
        </button>
      )}
      {authStatus === "authenticated" && !post.isDeleted && (
        <CreateCommentForm
          parentCommentId={null}
          postId={post.id}
          commentContent=""
          editOrCreate={editCommentOptions.editOrCreate}
          setCurrentParentCommentId={setCurrentParentCommentId}
        />
      )}
      <Loading size="large" show={isLoadingComments} />

      {comments && comments.length > 0 && (
        <PostComments
          comments={comments}
          post={post}
          editCommentOptions={editCommentOptions}
          setEditCommentOptions={setEditCommentOptions}
          setCurrentParentCommentId={setCurrentParentCommentId}
          main
        />
      )}
    </div>
  );
};

export type UIComment = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  content: string;
  postId: string;
  _count: {
    childComments: number;
    votes: number;
  };
  childComments?: UIComment[];
  isDeleted: boolean;
  votes: CommentVote[];
};

const PostComments: React.FC<{
  post: CommunityPosts["posts"][number];
  comments: UIComment[];
  editCommentOptions: {
    commentId: string | null;
    editOrCreate: "create" | "edit";
  };
  setEditCommentOptions: (x: {
    commentId: string | null;
    editOrCreate: "create" | "edit";
  }) => void;
  setCurrentParentCommentId: (x: string | null) => void;
  main?: boolean;
}> = ({
  post,
  comments,
  editCommentOptions,
  setEditCommentOptions,
  setCurrentParentCommentId,
  main,
}) => {
  const session = useSession();
  const [closedComments, setClosedComments] = useState<Set<string>>(new Set());

  const modsSet = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    set.add(post.community.ownerId);
    for (let i = 0; i < post.community.moderators.length; ++i) {
      set.add(post.community.moderators[i]?.userId ?? "");
    }
    return set;
  }, [post.community]);

  const showModeratorTools = Boolean(
    session.status === "authenticated" &&
      session.data.user &&
      (modsSet.has(session.data.user.id) || session.data.user.isGlobalMod)
  );

  function closeOrOpenComment(commentId: string) {
    return () => {
      if (closedComments.has(commentId)) {
        closedComments.delete(commentId);
      } else {
        closedComments.add(commentId);
      }
      setClosedComments((prev) => new Set(prev));
    };
  }

  return (
    <div
      className={cx(
        "mx-auto w-full max-w-3xl rounded bg-zinc-800 pr-1 pl-1 pt-2 md:max-w-5xl",
        main && "pb-3"
      )}
    >
      {comments.map((comment) => {
        return (
          <div key={comment.id} className="relative flex">
            <button
              className="mt-2 w-1 cursor-pointer rounded-full bg-zinc-600 hover:bg-zinc-200"
              onClick={closeOrOpenComment(comment.id)}
            ></button>
            {showModeratorTools && (
              <PostModeratorTools
                post={post}
                comment={{ id: comment.id, isDeleted: comment.isDeleted }}
              />
            )}
            <div
              className={cx(
                "mt-2 w-full overflow-hidden rounded-sm pl-2 pt-1 transition-colors duration-300",
                closedComments.has(comment.id) &&
                  "h-12 cursor-pointer bg-zinc-900"
              )}
              onClick={
                closedComments.has(comment.id)
                  ? () =>
                      setClosedComments((prev) => {
                        const x = new Set(prev);
                        x.delete(comment.id);
                        return x;
                      })
                  : undefined
              }
            >
              {!closedComments.has(comment.id) && comment.isDeleted && (
                <div className="flex items-center gap-2 p-1 text-sm text-zinc-200">
                  <BsFillExclamationTriangleFill className="text-red-500" />
                  This comment has been erased from the public eye.
                </div>
              )}
              <div className="mb-1 flex items-center gap-0.5 text-xs text-gray-400">
                <UserProfileLink
                  user={comment.user}
                  className="flex items-center hover:underline"
                >
                  <>
                    <div className="h-10 w-10">
                      {comment.user.image ? (
                        <Image
                          className="rounded-[50%] p-1 transition-all group-hover:rounded-lg"
                          loader={({ src }) => src}
                          src={comment.user.image}
                          alt={`Profile image of ${comment.user.name}`}
                          width="128"
                          height="128"
                          priority
                        />
                      ) : (
                        <AiFillMeh className="h-9 w-9 rounded-full text-white" />
                      )}
                    </div>
                    u/{comment.user.name}
                  </>
                </UserProfileLink>
                {(comment.user.isGlobalMod || modsSet.has(comment.user.id)) && (
                  <BsFillShieldFill
                    className={cx(
                      "ml-1",
                      comment.user.isGlobalMod
                        ? "text-green-600"
                        : "text-indigo-600"
                    )}
                  />
                )}
                <BsDot />
                {timeAgo(comment.createdAt)}
                {comment.updatedAt.getTime() !==
                  comment.createdAt.getTime() && (
                  <div className="mx-1 text-xs text-gray-400">
                    (edited {timeAgo(comment.updatedAt)} ago)
                  </div>
                )}
              </div>
              {!closedComments.has(comment.id) && (
                <div className="w-full">
                  <div className="ml-8">
                    <Markdown source={comment.content} />
                  </div>
                  <div className="ml-8 flex gap-8 md:gap-12">
                    <button
                      onClick={() => {
                        if (typeof navigator !== undefined && navigator.share) {
                          navigator.share({
                            text: `View this fantastic Bessit comment by /u/${comment.user.name}!`,
                            url: `${document.location.origin}/b/${
                              post.community.name
                            }/post/${post.id}/${slugify(post.title)}/${
                              comment.id
                            }`,
                            title: `/u/${comment.user.name} has a wholesome opinion regarding "${post.title}"`,
                          });
                        }
                      }}
                      className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-emerald-400"
                    >
                      <BsShare className="text-xl" />
                      <span className="hidden md:block">Share</span>
                    </button>
                    <CommentLikeButton
                      comment={comment}
                      userId={session.data?.user?.id}
                    />
                    {!post.isDeleted && (
                      <LoggedOnlyButton
                        Child={(props) => (
                          <button
                            {...props}
                            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-blue-500"
                          >
                            <BsChatLeft className="text-xl" />
                            <span className="hidden md:block">Reply</span>
                          </button>
                        )}
                        onClick={() => {
                          setEditCommentOptions(
                            editCommentOptions.commentId === comment.id
                              ? { editOrCreate: "create", commentId: null }
                              : {
                                  editOrCreate: "create",
                                  commentId: comment.id,
                                }
                          );
                        }}
                        icon={<BsChatLeft className="text-blue-500" />}
                        title={
                          <>
                            Reply to{" "}
                            <Link
                              href="/"
                              className="font-bold hover:underline"
                            >
                              {comment.user.name}
                            </Link>
                            &apos;s appreciable comment
                          </>
                        }
                        content="Join Bessit to share your thoughts with our incredible community"
                      />
                    )}
                    {session.data?.user?.id === comment.user.id && (
                      <NotBannedOnlyButton
                        onClick={() => {
                          setEditCommentOptions(
                            editCommentOptions.commentId === comment.id
                              ? { editOrCreate: "edit", commentId: null }
                              : { editOrCreate: "edit", commentId: comment.id }
                          );
                        }}
                        Child={(props) => (
                          <button
                            {...props}
                            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
                          >
                            <BsPencil className="text-xl" />
                            <span className="hidden md:block">Edit</span>
                          </button>
                        )}
                      />
                    )}
                  </div>
                  {session.status === "authenticated" && (
                    <div
                      className={cx(
                        "w-full transition-all",
                        editCommentOptions.commentId === comment.id
                          ? "min-h-[9rem]"
                          : "min-h-0"
                      )}
                    >
                      {editCommentOptions.commentId === comment.id &&
                        !post.isDeleted && (
                          <CreateCommentForm
                            parentCommentId={editCommentOptions.commentId}
                            commentContent={
                              editCommentOptions.editOrCreate === "edit"
                                ? comment.content
                                : ""
                            }
                            close={() =>
                              setEditCommentOptions({
                                commentId: null,
                                editOrCreate: "edit",
                              })
                            }
                            editOrCreate={editCommentOptions.editOrCreate}
                            postId={post.id}
                            setCurrentParentCommentId={
                              setCurrentParentCommentId
                            }
                          />
                        )}
                    </div>
                  )}

                  {comment.childComments && comment.childComments.length > 0 ? (
                    <PostComments
                      post={post}
                      comments={comment.childComments}
                      editCommentOptions={editCommentOptions}
                      setEditCommentOptions={setEditCommentOptions}
                      setCurrentParentCommentId={setCurrentParentCommentId}
                    />
                  ) : (
                    comment._count.childComments > 0 && (
                      <button
                        className="ml-4 text-indigo-400 hover:underline"
                        onClick={() => setCurrentParentCommentId(comment.id)}
                      >
                        {comment._count.childComments} more replies
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const postDataQuerySchema = z.object({
  community_name: z.string(),
  post_data: z.array(z.string()).min(2).max(3),
  cached_post: z.string().optional(),
});
const useCachedPost = (topElement: HTMLElement | null) => {
  const router = useRouter();
  const zodParsing = postDataQuerySchema.safeParse(router.query);
  const queryData = zodParsing.success ? zodParsing.data : undefined;
  const initialPlaceholderFromCache = queryData?.cached_post
    ? (superjson.parse(queryData.cached_post) as Partial<
        RouterOutputs["post"]["getPost"]
      >)
    : {};

  const postQuery = trpc.post.getPost.useQuery(
    { post_id: queryData?.post_data[0] ?? "NOT_SENDABLE" },
    {
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
      // TODO: Build infra so this doesn't look like shit
      placeholderData: {
        communityId: "communityId",
        community: {
          ownerId: "",
          name: "communityName",
          desc: "",
          id: "communityId",
          image: null,
          logo: null,
          moderators: [],
          rules: [],
        },
        content: "",
        createdAt: new Date(),
        id: "postId",
        isDeleted: false,
        title: "",
        updatedAt: new Date(),
        user: {
          email: "",
          emailVerified: new Date(),
          id: "",
          image: null,
          name: "",
          isGlobalMod: false,
          bannedUntil: new Date(0),
        },
        userId: "",
        votes: [],
        _count: { comments: 0, votes: 0 },
        ...initialPlaceholderFromCache,
      },
    }
  );

  const commentsQuery = trpc.post.getComments.useInfiniteQuery(
    {
      post: queryData?.post_data[0] ?? "NOT_SENDABLE",
      count: 25,
      mainCommentId: queryData?.post_data[2] ?? null,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: Boolean(queryData),
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      cacheTime: Infinity,
      notifyOnChangeProps: "all",
      keepPreviousData: true,
      placeholderData: { pages: [], pageParams: [] } as InfiniteData<
        RouterOutputs["post"]["getComments"]
      >,
    }
  );

  const flattenedComments = useMemo(() => {
    return (
      commentsQuery.data?.pages.reduce<
        typeof commentsQuery["data"]["pages"][number]["comments"]
      >((acc, cur) => {
        acc.push(...cur.comments);
        return acc;
      }, []) || []
    );
  }, [commentsQuery]);

  useEffect(() => {
    const listener = () => {
      if (
        commentsQuery.isLoading ||
        commentsQuery.isFetchingNextPage ||
        !commentsQuery.hasNextPage
      )
        return;
      if (
        window.innerHeight + window.scrollY + 800 >
        document.body.offsetHeight
      ) {
        commentsQuery.fetchNextPage();
      }
    };
    window.addEventListener("scroll", listener);

    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [commentsQuery]);

  return {
    is404: postQuery.status === "success" && !postQuery.data,
    post: postQuery.data,
    comments: flattenedComments,
    isLoading: {
      post: postQuery.isFetching || postQuery.isLoading,
      comments: commentsQuery.isLoading || commentsQuery.isFetching,
    },
    currentMainCommentId: queryData?.post_data[2] ?? null,
    setCurrentMainCommentId: (commentId: string | null) => {
      if (!queryData?.post_data) return;
      const copyPostData = [...queryData.post_data];
      if (commentId === null && copyPostData.length === 3) {
        copyPostData.pop();
      } else {
        copyPostData[2] = commentId as string;
      }
      topElement?.scrollIntoView({ behavior: "smooth", block: "end" });
      router.push(
        { query: { ...router.query, post_data: copyPostData } },
        postQuery.data
          ? `/b/${postQuery.data.community.name}/post/${
              postQuery.data.id
            }/${slugify(postQuery.data.title)}/${commentId ?? ""}`
          : undefined,
        { shallow: true }
      );
    },
  };
};
