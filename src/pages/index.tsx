import { type NextPage } from "next";
import Head from "next/head";
import { PostEditor } from "../components/PostEditor";
import { PostsViewer } from "../components/PostsViewer";
import { useCommunityPosts } from "../hooks/useCommunityPosts";

const Home: NextPage = () => {
  const communityPosts = useCommunityPosts(null);

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
        <div className="container my-2 mx-auto flex flex-col items-center justify-center">
          <PostEditor />
          <PostsViewer communityPosts={communityPosts} />
        </div>
      </main>
    </>
  );
};

export default Home;
