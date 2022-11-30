import { type NextPage } from "next";
import Head from "next/head";
import { TopBar } from "../components/TopBar";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cx } from "../utils/general";

const CreateCommunity: NextPage = () => {
  return (
    <>
      <Head>
        <title>Bessit | Create Community </title>
        <meta
          name="description"
          content="Create a community on the Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen flex-col items-center justify-center bg-zinc-900">
        <TopBar />
        <CreateCommunityForm />
      </main>
    </>
  );
};

const schema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must have at least 2 characters" })
    .max(24, { message: "Name must have at most 24 characters" }),
  desc: z.string(),
});

const CreateCommunityForm: React.FC = () => {
  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    mode: "onTouched",
    resolver: zodResolver(schema),
  });
  const onSubmit = (data: z.infer<typeof schema>) => console.log(data);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded border-2 border-zinc-800 p-8"
    >
      <div className="flex w-full">
        <h2 className="my-2 w-full text-3xl text-white">Create a community</h2>
      </div>
      <hr className="my-2" />
      <div className="w-full">
        <div
          className={cx(
            "overflow-hidden text-red-400 transition-all",
            formState.errors?.name?.message ? "h-8" : "h-0"
          )}
        >
          {formState.errors?.name?.message}
        </div>
        <div className="flex w-full items-center gap-1 text-xl text-white">
          <span className="rounded-full bg-gray-600 p-1">/b/</span>
          <Controller
            name="name"
            control={control}
            rules={{ pattern: /^[a-zA-Z0-9_]*$/ }}
            render={({ field, formState }) => (
              <input
                {...field}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replaceAll(
                    /[^a-zA-Z0-9_]*/g,
                    ""
                  );
                }}
                className={cx(
                  "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                  formState.errors.name
                    ? "border-red-600"
                    : "border-zinc-500 focus:border-zinc-300"
                )}
                type="text"
                placeholder="Community name"
              />
            )}
          />
        </div>
      </div>
      <Controller
        name="desc"
        control={control}
        render={({ field }) => (
          <textarea
            {...field}
            className="my-2 min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
            placeholder="What is it about?"
          ></textarea>
        )}
      />
      <button
        type="submit"
        className="mt-4 w-24 rounded bg-indigo-700 p-2 text-white"
      >
        Create
      </button>
    </form>
  );
};

export default CreateCommunity;
