import { useSession } from "next-auth/react";
import { useState } from "react";
import { BsShieldX } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import { Dialog } from "./Dialog";

export function NotBannedOnlyButton<T extends React.FC>({
  Child,
  onClick,
}: {
  Child: T; // The button to be wrapped
  onClick: React.MouseEventHandler; // An event handler for when the user is logged in
}) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const session = useSession();

  const isLoggedIn = session.status === "authenticated";

  if (!isLoggedIn) {
    return null;
  }

  const isBanned = new Date(session.data.user?.bannedUntil || 0) > new Date();

  return (
    <>
      {isBanned && (
        <Dialog isOpen={isOpen} close={() => setOpen(false)}>
          <div className="relative m-auto w-full max-w-xs rounded bg-zinc-800 px-4 py-5 text-center text-white md:max-w-sm md:py-8 md:px-6">
            <button
              className="absolute top-2 left-2 mr-auto rounded-full text-2xl text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setOpen(false)}
            >
              <IoMdClose />
            </button>
            <div className="mx-auto mb-3 w-min text-center text-2xl md:text-4xl">
              <BsShieldX className="text-red-500" />
            </div>
            <h2 className="py-2 text-xl md:text-2xl">
              Your account has been banned.
            </h2>
            <hr className="my-1.5 opacity-25" />
            <p className="p-4 text-start text-sm text-zinc-400 md:text-base">
              Some actions can not be performed by banned users. Be better next
              time, you know how.
            </p>
          </div>
        </Dialog>
      )}
      {Child({ onClick: !isBanned ? onClick : () => setOpen(true) })}
    </>
  );
}
