import ReactMarkdown from "react-markdown";
import { cx, slugify } from "../utils/general";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useMemo } from "react";
import { trpc } from "../utils/trpc";
import Link from "next/link";

const communityNameRegex = /(^|\s)(\/b\/[a-z0-9_]{2,24})($|\s)/gm;
const userIdRegex =
  /(^|\s)(\/u\/([a-zA-Z0-9\.@*\$\/\\\#]{2,32}|\(([^ ][a-zA-Z0-9\.@*\$\/\\\# ]{1,32})\)))($|\s)/gm;
export const Markdown: React.FC<{ source: string; simplify?: boolean }> = ({
  source,
  simplify,
}) => {
  const usersMatched = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      [...source.matchAll(userIdRegex)].map((match) => match[4] ?? match[3]!),
    [source]
  );

  // TODO: Check why cache is invalid
  const userQueries = trpc.useQueries((t) =>
    usersMatched.map((u) => t.search.search({ q: `/u/${u}` }))
  );

  const usersMap = useMemo(() => {
    const res = new Map();
    for (const userQuery of userQueries) {
      if (userQuery.data?.users?.length) {
        const user = userQuery.data.users[0];
        if (user?.name) {
          res.set(user.name, user);
        }
      }
    }
    return res;
  }, [userQueries]);

  const memoizedSource = useMemo<string>(() => {
    const newSource = source
      .replaceAll(communityNameRegex, '$1<a href="$2">$2</a>$3')
      .replaceAll(userIdRegex, (a, b, _c, d, e, f) => {
        const username = e ?? d;
        if (usersMap.has(username)) {
          return `${b}<a data-is-user-link="true" href="/u/${
            usersMap.get(e ?? d)?.id
          }/${slugify(username)}">/u/${username}</a>${f}`;
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
