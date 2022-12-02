import ReactMarkdown from "react-markdown";
import { cx } from "../utils/general";

export const Markdown: React.FC<{ source: string; simplify?: boolean }> = ({
  source,
  simplify,
}) => {
  return (
    <ReactMarkdown
      className={cx(
        simplify
          ? "max-h-44 overflow-hidden bg-gradient-to-b from-white to-transparent bg-[length:100%_11rem] bg-clip-text text-transparent"
          : "prose prose-invert"
      )}
    >
      {source}
    </ReactMarkdown>
  );
};
