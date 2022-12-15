import Link from "next/link";
import { type LinkProps } from "next/link";
import { cx, slugify } from "../utils/general";

type MinimalUser = { id: string; name?: string | null };

export const UserProfileLink: React.FC<
  Omit<LinkProps, "href"> & {
    user: MinimalUser;
    children?: JSX.Element;
    className?: string;
  }
> = ({ user, children, className, ...rest }) => {
  return (
    <Link
      {...rest}
      href={
        (user.id &&
          user.name &&
          `/u/${user.id}/${slugify(user.name ?? "anon")}`) ||
        "/"
      }
      className={cx("font-bold hover:underline ", className)}
    >
      {children ?? (user.name ? `u/${user.name}` : "u/anon")}
    </Link>
  );
};
