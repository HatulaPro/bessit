import { zodResolver } from "@hookform/resolvers/zod";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { CommunityLogo } from "../../../../components/CommunityLogo";
import { ImageHidesOnError } from "../../../../components/ImageHidesOnError";
import { useLoggedOnly } from "../../../../hooks/useLoggedOnly";
import { cx } from "../../../../utils/general";
import { trpc, type RouterOutputs } from "../../../../utils/trpc";

const CommunitySettingsPage: NextPage = () => {
  const pageTitle = "Bessit | Community Settings";
  const router = useRouter();
  const community_name = router.query.community_name as string | undefined;
  useLoggedOnly(community_name ? `/b/${community_name}` : "/");

  const getCommunityQuery = trpc.community.getCommunity.useQuery(
    { name: community_name || "UNSENDABLE" },
    {
      enabled: community_name !== undefined,
      cacheTime: Infinity,
      staleTime: Infinity,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Edit the settings of your Bessit community."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen w-full items-center bg-zinc-900 pt-16 pb-2 text-white md:pt-20">
        {getCommunityQuery.data && (
          <EditCommunityForm community={getCommunityQuery.data} />
        )}
      </main>
    </>
  );
};

type CommunityReturnType = Exclude<
  RouterOutputs["community"]["getCommunity"],
  null
>;

const CommunityPreview: React.FC<{
  name: string;
  desc: string;
  image: string | null;
  logo: string | null;
}> = ({ name, image, logo, desc }) => {
  return (
    <div className="w-full max-w-xs rounded-md border-2 border-zinc-500 p-2">
      <div className="bg-rotate relative h-12 w-full bg-gradient-radial from-stone-700 bg-[length:12px_12px] md:h-20">
        {image && (
          <ImageHidesOnError
            loader={({ src }) => src}
            src={image}
            alt={`Community image of ${name}`}
            className="object-cover"
            fill
          />
        )}
      </div>
      <div className="ml-4 flex -translate-y-1/3 items-center gap-1 text-lg font-bold md:ml-12 md:max-w-3xl">
        <CommunityLogo name={name} logo={logo} size="medium" />
        <span>/b/{name}</span>
      </div>
      <p className="text-xs text-gray-300">{desc}</p>
    </div>
  );
};
const editCommunitySchema = z.object({
  desc: z.string(),
  image: z.union([
    z
      .string()
      .url()
      .refine((value) => value.endsWith("jpg")),
    z.string().length(0),
  ]),
  logo: z.union([
    z
      .string()
      .url()
      .refine((value) => value.endsWith("jpg")),
    z.string().length(0),
  ]),
});
type editCommunityForm = z.infer<typeof editCommunitySchema>;

const EditCommunityForm: React.FC<{ community: CommunityReturnType }> = ({
  community,
}) => {
  const { control, handleSubmit, formState, watch } =
    useForm<editCommunityForm>({
      mode: "onTouched",
      resolver: zodResolver(editCommunitySchema),
      defaultValues: {
        desc: community.desc,
        image: community.image ?? "",
        logo: community.logo ?? "",
      },
    });

  const onSubmit = (data: editCommunityForm) => {
    console.log(data);
  };

  const [inputDesc, inputImage, inputLogo] = watch(["desc", "image", "logo"]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto my-auto flex w-full max-w-3xl flex-col items-center gap-2 rounded border-2 border-zinc-800 p-8"
    >
      <div className="w-full">
        <h2 className="my-2 w-full text-3xl text-white">Community Settings</h2>
      </div>
      <CommunityPreview
        name={community.name}
        desc={inputDesc}
        image={inputImage}
        logo={inputLogo}
      />
      <hr className="my-2" />

      <Controller
        name="desc"
        control={control}
        render={({ field }) => (
          <textarea
            {...field}
            className="my-2 min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 border-zinc-500 bg-transparent p-1 text-zinc-200 outline-none focus:border-zinc-300"
            placeholder="What is it about?"
          >
            {field.value}
          </textarea>
        )}
      />

      <Controller
        control={control}
        name="image"
        render={({ field, fieldState }) => (
          <>
            <div
              className={cx(
                "overflow-hidden text-red-400 transition-all",
                fieldState.error?.message ? "h-5" : "h-0"
              )}
            >
              {fieldState.error?.message}
            </div>
            <input
              autoComplete="off"
              {...field}
              className={cx(
                "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                fieldState.error
                  ? "border-red-600"
                  : "border-zinc-500 focus:border-zinc-300"
              )}
              type="text"
              placeholder="Community Banner"
            />
          </>
        )}
      />

      <Controller
        control={control}
        name="logo"
        render={({ field, fieldState }) => (
          <>
            <div
              className={cx(
                "overflow-hidden text-red-400 transition-all",
                fieldState.error?.message ? "h-5" : "h-0"
              )}
            >
              {fieldState.error?.message}
            </div>
            <input
              autoComplete="off"
              {...field}
              className={cx(
                "w-full rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                fieldState.error
                  ? "border-red-600"
                  : "border-zinc-500 focus:border-zinc-300"
              )}
              type="text"
              placeholder="Community Logo"
            />
          </>
        )}
      />

      <button
        type="submit"
        className={cx(
          "mt-4 w-24 rounded-md bg-indigo-800 p-2 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
        )}
        disabled={!formState.isValid}
      >
        Save
      </button>
    </form>
  );
};

export default CommunitySettingsPage;
