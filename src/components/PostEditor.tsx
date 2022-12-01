export const PostEditor: React.FC = () => {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-2 rounded border-2 border-zinc-800 p-8">
      <div className="flex w-full">
        <h2 className="my-2 w-full text-3xl text-white">Create a post</h2>
      </div>
      <hr className="my-2" />
      <input
        className="w-full rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
        type="text"
        placeholder="Title"
      />
      <textarea
        className="min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
        placeholder="Your awesome post"
      ></textarea>

      <button className="mt-4 w-24 rounded bg-indigo-700 p-2 text-white">
        Create
      </button>
    </div>
  );
};
