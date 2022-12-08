import Image from "next/image";
import { cx } from "../utils/general";

export const CommunityLogo: React.FC<{
  logo: string | null;
  name: string;
  size: "small" | "large";
}> = ({ logo, name, size }) => {
  return (
    <div
      className={cx(
        "flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-400 bg-indigo-800 text-center",
        size === "large"
          ? "flex h-20 w-20 text-5xl md:h-24 md:w-24 md:text-7xl"
          : "flex h-5 w-5 text-xs md:h-6 md:w-6 md:text-sm"
      )}
    >
      {logo ? (
        <Image src={logo} alt={`Community logo of ${name}`} fill />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
};
