import { type NextPage } from "next";
import Head from "next/head";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";
import { Loading } from "../components/Loading";
import { useDebounce } from "../hooks/useDebounce";
import { useLoggedOnly } from "../hooks/useLoggedOnly";
import { NotBannedOnlyButton } from "../components/NotBannedOnlyButton";
import { useRef } from "react";
import { useCommunityRedirect } from "../hooks/useRedirects";

const CreateCommunity: NextPage = () => {
  useLoggedOnly("/");
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
        <CreateCommunityForm />
      </main>
    </>
  );
};

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must have at least 2 characters" })
    .max(24, { message: "Name must have at most 24 characters" })
    .regex(/^[a-z0-9_]*$/),
  desc: z.string(),
});
export type createCommunityForm = z.infer<typeof createCommunitySchema>;

const CreateCommunityForm: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const { control, handleSubmit, formState, setError, watch } =
    useForm<createCommunityForm>({
      mode: "onTouched",
      resolver: zodResolver(createCommunitySchema),
      defaultValues: { name: "", desc: "" },
    });
  const name = useDebounce(watch("name"), 3000);
  const createCommunityMutation = trpc.community.createCommunity.useMutation();
  const getCommunityQuery = trpc.community.getCommunity.useQuery(
    { name },
    {
      enabled: name !== undefined && formState.isValid,
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      onSuccess(data) {
        if (data && !createCommunityMutation.isSuccess) {
          setError("name", { message: "Community name is already taken." });
        }
      },
    }
  );

  const communityRedirect = useCommunityRedirect();
  const onSubmit = (data: createCommunityForm) => {
    createCommunityMutation
      .mutateAsync({ name: data.name, desc: data.desc })
      .then((com) => {
        getCommunityQuery.refetch().then(() => {
          communityRedirect({
            ...com,
            moderators: [],
            _count: { members: 0 },
            members: [],
          });
        });
      })
      .catch((reason) => {
        setError("name", reason.shape?.message ?? "Unkown error.");
      });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded border-2 border-zinc-800 p-8"
      ref={formRef}
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
            rules={{ pattern: /^[a-z0-9_]*$/ }}
            render={({ field, formState }) => (
              <input
                {...field}
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value
                    .toLowerCase()
                    .replaceAll(/[^a-z0-9_]*/g, "");
                }}
                className={cx(
                  "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                  formState.errors.name
                    ? "border-red-600"
                    : "border-zinc-500 focus:border-zinc-300"
                )}
                type="text"
                placeholder="Community name"
                autoComplete="off"
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
      <NotBannedOnlyButton
        onClick={() => formRef.current?.requestSubmit()}
        Child={(props) => (
          <button
            {...props}
            type="button"
            className={cx(
              "mt-4 w-24 rounded-md bg-indigo-800 p-2 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
            )}
            disabled={!formState.isValid || createCommunityMutation.isLoading}
          >
            Create
          </button>
        )}
      />
      <Loading size="small" show={createCommunityMutation.isLoading} />
    </form>
  );
};

export default CreateCommunity;
