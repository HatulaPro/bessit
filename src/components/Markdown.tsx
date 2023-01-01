import ReactMarkdown from "react-markdown";
import {
  cx,
  slugify,
  FIND_COMMUNITIES_REGEX,
  FIND_USERS_REGEX,
} from "../utils/general";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useMemo } from "react";
import { trpc } from "../utils/trpc";
import Link from "next/link";

export const Markdown: React.FC<{ source: string; simplify?: boolean }> = ({
  source,
  simplify,
}) => {
  const usersMatched = useMemo(
    () =>
      [...source.matchAll(FIND_USERS_REGEX)].map(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (match) => match[4] ?? match[3]!
      ),
    [source]
  );

  const userQueries = trpc.useQueries((t) =>
    usersMatched.map((name) => {
      const query = t.search.getTaggedUser({ name });
      query.enabled = !simplify;
      query.cacheTime = Infinity;
      query.staleTime = Infinity;
      query.refetchOnWindowFocus = false;
      query.refetchOnReconnect = false;
      return query;
    })
  );

  const usersMap = useMemo(() => {
    const res = new Map();
    for (const userQuery of userQueries) {
      if (userQuery.data) {
        if (userQuery.data.name) {
          res.set(userQuery.data.name, userQuery.data);
        }
      }
    }
    return res;
  }, [userQueries]);

  const memoizedSource = useMemo<string>(() => {
    const newSource = source
      .replaceAll(FIND_COMMUNITIES_REGEX, '$1<a href="$2">$2</a>$3')
      .replaceAll(FIND_USERS_REGEX, (a, b, _c, d, e, f) => {
        const username = e ?? d;
        if (usersMap.has(username)) {
          return `${b}<a href="/u/${usersMap.get(e ?? d)?.id}/${slugify(
            username
          )}">/u/${username}</a>${f}`;
        } else {
          return a;
        }
      });
    return newSource;
  }, [source, usersMap]);

  return (
    <ReactMarkdown
      className={cx(
        "markdown",
        simplify
          ? "max-h-44 overflow-hidden bg-gradient-to-b from-white to-transparent bg-[length:100%_11rem] bg-clip-text text-transparent"
          : "prose prose-invert max-h-[70vh] min-h-[2rem] max-w-full overflow-y-auto"
      )}
      skipHtml={simplify}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={simplify ? undefined : [rehypeRaw, rehypeSanitize]}
      components={{
        a: (idk) => {
          return <Link href={idk.href ?? "#"}>{idk.children}</Link>;
        },
      }}
    >
      {memoizedSource}
    </ReactMarkdown>
  );
};
