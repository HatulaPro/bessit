import { type NextPage } from "next";
import Head from "next/head";
import { PostEditor } from "../components/PostEditor";
import { PostsViewer } from "../components/PostsViewer";
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
        <div className="container my-2 flex flex-col items-center justify-center">
          <PostEditor />
          <PostsViewer communityName={null} />
        </div>
      </main>
    </>
  );
};

export default Home;
