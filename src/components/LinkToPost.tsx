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
  children: JSX.Element;
}> = ({ post, children, className }) => {
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
      className={className}
    >
      {children}
    </Link>
  );
};
