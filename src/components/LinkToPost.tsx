import Link from "next/link";
import superjson from "superjson";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { slugify } from "../utils/general";

export const LinkToPost: React.FC<{
  post: Partial<CommunityPosts["posts"][number]> & {
    community: { name: string };
    id: string;
    title: string;
  };
  className?: string;
  commentId?: string;
  children: JSX.Element;
}> = ({ post, children, className, commentId }) => {
  const link = `/b/${post.community.name}/post/${post.id}/${slugify(
    post.title
  )}${commentId ? "/" + commentId : ""}`;
  return (
    <Link
      href={{
        pathname: link,
        query: { cached_post: superjson.stringify(post) },
      }}
      as={link}
      shallow
      className={className}
    >
      {children}
    </Link>
  );
};
