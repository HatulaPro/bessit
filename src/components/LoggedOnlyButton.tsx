import { signIn, useSession } from "next-auth/react";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { Dialog } from "./Dialog";

export function LoggedOnlyButton<T extends React.FC>({
  Child,
  onClick,
  icon,
  title,
  content,
}: {
  Child: T; // The button to be wrapped
  onClick: React.MouseEventHandler; // An event handler for when the user is logged in
  icon: React.ReactNode; // Recommended: react-icons icon, with only a *text-color* style.
  title: React.ReactNode; // The title of the dialog when opened, wrap in a fragment
  content: string; // The content of the dialog when opened
}) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const { status: authStatus } = useSession();

  const isLoggedIn = authStatus === "authenticated";

  return (
    <>
      {!isLoggedIn && (
        <Dialog isOpen={isOpen} close={() => setOpen(false)}>
          <div className="relative m-auto w-full max-w-xs rounded bg-zinc-800 px-4 py-5 text-center text-white md:max-w-sm md:py-8 md:px-6">
            <button
              className="absolute top-2 left-2 mr-auto rounded-full text-2xl text-white hover:bg-white hover:bg-opacity-20"
              onClick={() => setOpen(false)}
            >
              <IoMdClose />
            </button>
            <div className="mx-auto mb-3 w-min text-center text-2xl md:text-4xl">
              {icon}
            </div>
            <h2 className="py-2 text-xl md:text-2xl">{title}</h2>
            <hr className="my-1.5 opacity-25" />
            <p className="p-4 text-start text-sm text-zinc-400 md:text-base">
              {content}
            </p>

            <button
              className="w-full rounded bg-indigo-700 py-2 px-6 text-lg text-white"
              onClick={() => signIn()}
            >
              Log In
            </button>
          </div>
        </Dialog>
      )}
      {Child({ onClick: isLoggedIn ? onClick : () => setOpen(true) })}
    </>
  );
}

// Usage example:
/* <LoggedOnlyButton
  Child={(props) => {
    return <button {...props}>hello</button>;
  }}
  onClick={(e) => console.log(e)}
  icon={<BsSuitHeartFill className="text-red-500" />}
  title={
    <>
      Like{" "}
      <Link href="/" className="font-bold hover:underline">
        Hatula Pro
      </Link>
      &apos;s great post
    </>
  }
  content="Join Bessit to let the world know of your appreciation of awesome content"
/>; 
*/
