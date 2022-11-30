import { type NextPage } from "next";
import Head from "next/head";
import { trpc } from "../utils/trpc";
import { useState } from "react";
import { TopBar } from "../components/TopBar";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Bessit | The Best Reddit alternative </title>
        <meta
          name="description"
          content="The Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-zinc-900">
        <TopBar />
        <Square />
      </main>
    </>
  );
};

export default Home;

const Square: React.FC = () => {
  const [num, setNum] = useState<number>(0);
  const [otherData, setOtherData] = useState<number>(0);
  const result = trpc.auth.calculateSquare.useQuery(
    { num },
    { refetchOnWindowFocus: false }
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 text-white">
      <p>
        The square of {num} is: {result.data ?? "Loading..."}
      </p>
      <div className="m-2 flex gap-4">
        <button
          className="rounded bg-green-800 px-6 py-1"
          onClick={() => {
            setNum((prev) => prev + 1);
          }}
        >
          BUMP
        </button>
        <button
          className="rounded bg-green-800 px-6 py-1"
          onClick={() => setOtherData(() => Math.floor(Math.random() * 100))}
        >
          CHANGE ({otherData})
        </button>
      </div>
    </div>
  );
};
