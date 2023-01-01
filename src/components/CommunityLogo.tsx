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
        "relative flex items-center justify-center overflow-hidden rounded-full bg-indigo-800",
        size === "large"
          ? "h-20 w-20 text-5xl md:h-24 md:w-24 md:text-7xl"
          : size === "small"
          ? "h-5 w-5 text-xs md:h-7 md:w-7 md:text-sm"
          : "h-7 w-7 text-base md:h-8 md:w-8 md:text-lg",
        name.length === 0 && "animate-pulse"
      )}
    >
      {logo ? (
        <ImageHidesOnError
          loader={({ src }) => src}
          src={logo}
          alt={`Community logo of ${name}`}
          className="object-cover"
          fill
          priority
        />
      ) : (
        name[0]?.toUpperCase() || "?"
      )}
    </div>
  );
};
