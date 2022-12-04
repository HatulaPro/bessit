import Image from "next/image";
import Link from "next/link";

export const NotFoundMessage: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="container m-auto text-center">
      <Image
        src="/okay_guy.png"
        alt="Dude is sad because he could not find somethingy"
        width={200}
        height={200}
        className="mx-auto"
      />
      <h2 className="text-3xl text-white">{message}</h2>
      <Link href="/" className="my-8 text-xl text-indigo-500 hover:underline">
        Go Home
      </Link>
    </div>
  );
};
