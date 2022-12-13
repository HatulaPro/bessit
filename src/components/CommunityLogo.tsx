import { cx } from "../utils/general";
import { ImageHidesOnError } from "./ImageHidesOnError";

export const CommunityLogo: React.FC<{
  logo: string | null;
  name: string;
  size: "small" | "large" | "medium";
}> = ({ logo, name, size }) => {
  return (
    <div
      className={cx(
        "relative flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-400 bg-indigo-800 text-center",
        size === "large"
          ? "flex h-20 w-20 text-5xl md:h-24 md:w-24 md:text-7xl"
          : size === "small"
          ? "flex h-5 w-5 text-xs md:h-6 md:w-6 md:text-sm"
          : "md: flex h-7 w-7 text-base md:h-8 md:w-8 md:text-lg"
      )}
    >
      {logo ? (
        <ImageHidesOnError
          loader={({ src }) => src}
          src={logo}
          alt={`Community logo of ${name}`}
          className="rounded-full object-cover"
          fill
        />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
};
