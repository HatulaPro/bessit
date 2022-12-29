import ReactMarkdown from "react-markdown";
import { cx } from "../utils/general";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

export const Markdown: React.FC<{ source: string; simplify?: boolean }> = ({
  source,
  simplify,
}) => {
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
    >
      {source}
    </ReactMarkdown>
  );
};
