import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { PostEditor } from "../components/PostEditor";
import { PostsViewer } from "../components/PostsViewer";
import {
  SortBySection,
  type SortingOptions,
} from "../components/SortBySection";
import { useCommunityPosts } from "../hooks/useCommunityPosts";

const Home: NextPage = () => {
  const [sortBy, setSortBy] = useState<SortingOptions>("hot");
  const communityPosts = useCommunityPosts(null, sortBy);

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
        <div className="container my-2 mx-auto flex flex-col items-center justify-center px-0.5">
          <PostEditor defaultOpen={false} />
          <SortBySection
            isLoading={communityPosts.isLoading}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          <PostsViewer communityPosts={communityPosts} />
        </div>
      </main>
    </>
  );
};

export default Home;
