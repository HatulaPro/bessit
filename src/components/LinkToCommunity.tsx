import { type RouterOutputs } from "../utils/trpc";
import superjson from "superjson";
import Link from "next/link";

export const LinkToCommunity: React.FC<{
  community: Partial<RouterOutputs["community"]["getCommunity"]> & {
    name: string;
  };
  className?: string;
  children: JSX.Element;
}> = ({ community, children, className }) => {
  return (
    <Link
      href={{
        pathname: `/b/${community.name}`,
        query: { cached_community: superjson.stringify(community) },
      }}
      as={`/b/${community.name}`}
      shallow
      className={className}
    >
      {children}
    </Link>
  );
};
