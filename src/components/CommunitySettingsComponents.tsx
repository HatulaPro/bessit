import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BsX, BsPlus } from "react-icons/bs";
import z from "zod";
import type { CommunityReturnType } from "../pages/b/[community_name]/community_settings";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";
import { CommunityLogo } from "./CommunityLogo";
import { Dialog } from "./Dialog";
import { ImageHidesOnError } from "./ImageHidesOnError";
import { LinkToCommunity } from "./LinkToCommunity";
import { Loading } from "./Loading";
import { UserProfileLink } from "./UserProfileLink";

const CommunitySettingsComponents: React.FC<{
  community: CommunityReturnType;
}> = ({ community }) => {
  return (
    <>
      <EditCommunityForm community={community} />
      <EditCommunityModerators community={community} />
      <EditCommunityRules community={community} />
    </>
  );
};
export default CommunitySettingsComponents;

export const editCommunitySchema = z.object({
  desc: z.string(),
  image: z.union([
    z.string().startsWith("https://").url(),
    z.string().length(0),
  ]),
  logo: z.union([
    z.string().startsWith("https://").url(),
    z.string().length(0),
  ]),
});
type editCommunityForm = z.infer<typeof editCommunitySchema>;

const EditCommunityForm: React.FC<{
  community: CommunityReturnType;
}> = ({ community }) => {
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

  const router = useRouter();
  const utils = trpc.useContext();
  const editComunityMutation = trpc.community.editCommunity.useMutation({
    onSuccess: (data) => {
      utils.community.invalidate();
      utils.post.invalidate();
      utils.search.invalidate();
      utils.community.getCommunity.setData({ name: data.name }, (prev) => {
        if (!prev) return community;
        return { ...prev, ...data };
      });
      router.push(`/b/${data.name}`);
    },
  });

  const onSubmit = (data: editCommunityForm) => {
    editComunityMutation.mutate({ ...data, name: community.name });
  };

  const [inputDesc, inputImage, inputLogo] = watch(["desc", "image", "logo"]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col items-center gap-2"
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
        disabled={!formState.isValid || editComunityMutation.isLoading}
      >
        Save
      </button>
      <Loading size="small" show={editComunityMutation.isLoading} />
    </form>
  );
};

const EditCommunityModerators: React.FC<{ community: CommunityReturnType }> = ({
  community,
}) => {
  const [newModId, setNewModId] = useState<string>("");

  const utils = trpc.useContext();
  const addModMutation = trpc.moderator.addModerator.useMutation({
    onSuccess: (data) => {
      utils.community.getCommunity.setData({ name: community.name }, () => {
        return { ...community, ...data };
      });
    },
  });
  const removeModMutation = trpc.moderator.removeModerator.useMutation({
    onSuccess: (data) => {
      utils.community.getCommunity.setData({ name: community.name }, () => {
        return { ...community, ...data };
      });
    },
  });
  const newModError =
    addModMutation.error?.message || removeModMutation.error?.message;

  return (
    <div className="my-8 w-full">
      <h2 className="my-2 w-full text-3xl text-white">Community Moderators</h2>

      <div className="w-full">
        {community.moderators.map((mod) => (
          <div
            key={mod.userId}
            className="my-1 flex items-center gap-2 rounded border-2 border-zinc-500 p-1"
          >
            <button
              type="button"
              className="rounded p-1 text-2xl text-red-500 transition-colors hover:bg-black disabled:text-zinc-300"
              disabled={removeModMutation.isLoading}
              onClick={() =>
                removeModMutation.mutate({
                  communityId: community.id,
                  moderatorId: mod.userId,
                })
              }
            >
              <BsX />
            </button>
            <UserProfileLink user={mod.user} />{" "}
            <span className="ml-auto hidden text-sm font-normal text-zinc-400 md:block">
              {mod.userId}
            </span>
          </div>
        ))}
      </div>
      <span
        className={cx(
          "block overflow-hidden text-red-500 transition-all",
          newModError ? "h-7" : "h-0"
        )}
      >
        {newModError}
      </span>
      <Loading
        size="small"
        show={addModMutation.isLoading || removeModMutation.isLoading}
      />
      <form
        className={cx(
          "mt-1 flex items-center gap-1 rounded border-2 p-1",
          newModError
            ? "border-red-500"
            : "border-zinc-500 focus-within:border-zinc-300"
        )}
        onSubmit={(e) => {
          e.preventDefault();
          if (newModId.length === 0) return;
          if (newModId.length === 25) {
            addModMutation.mutate({
              communityId: community.id,
              moderatorId: newModId,
            });
            setNewModId("");
            return;
          }
        }}
      >
        <button
          type="submit"
          className="overflow-hidden rounded p-1 text-2xl text-white transition-all enabled:hover:bg-black disabled:w-0 disabled:px-0"
          disabled={addModMutation.isLoading || newModId.length !== 25}
        >
          <BsPlus />
        </button>
        <input
          type="text"
          placeholder="User ID of new mod"
          className="w-full border-none bg-transparent text-zinc-200 outline-none"
          value={newModId}
          onChange={(e) =>
            setNewModId(e.currentTarget.value.replaceAll(/[^a-z0-9]*/g, ""))
          }
        />
      </form>
      <TransferCommunityForm community={community} />
    </div>
  );
};

const TransferCommunityForm: React.FC<{ community: CommunityReturnType }> = ({
  community,
}) => {
  const [newOwnerId, setNewOwnerId] = useState<string>("");

  const utils = trpc.useContext();
  const router = useRouter();
  const transferCommunityMutation =
    trpc.moderator.transferCommunity.useMutation({
      onSuccess: () => {
        utils.community.getCommunity.invalidate({ name: community.name });
        router.push(`/b/${community.name}`);
      },
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (newOwnerId.length === 0) return;
        if (newOwnerId.length === 25) {
          transferCommunityMutation.mutate({
            communityId: community.id,
            newOwnerId: newOwnerId,
          });
          return;
        }
      }}
      className="mt-6"
    >
      <h3 className="text-3xl text-white">Transfer community</h3>
      <Loading size="small" show={transferCommunityMutation.isLoading} />
      <span
        className={cx(
          "block overflow-hidden text-sm text-red-500 transition-all",
          transferCommunityMutation.error ? "h-5" : "h-0"
        )}
      >
        {transferCommunityMutation.error?.message}
      </span>
      <input
        type="text"
        placeholder="User ID of new owner"
        className={cx(
          "my-2 w-full gap-1 rounded border-2 bg-transparent p-2 text-zinc-200 outline-none",
          transferCommunityMutation.error
            ? "border-red-500"
            : "border-zinc-500 focus-within:border-zinc-300"
        )}
        value={newOwnerId}
        onChange={(e) =>
          setNewOwnerId(e.currentTarget.value.replaceAll(/[^a-z0-9]*/g, ""))
        }
      />
      <button
        type="submit"
        className="mx-auto block rounded bg-red-700 p-1 text-base text-white transition-colors enabled:hover:bg-red-800 disabled:contrast-50"
        disabled={
          transferCommunityMutation.isLoading || newOwnerId.length !== 25
        }
      >
        Transfer Community
      </button>
    </form>
  );
};

const EditCommunityRules: React.FC<{ community: CommunityReturnType }> = ({
  community,
}) => {
  const [currentRuleIndex, setCurrentRuleIndex] = useState<number>(-1);
  const [isOpen, setOpen] = useState<boolean>(false);

  return (
    <div className="mt-8 w-full">
      <h2 className="my-2 w-full text-3xl text-white">Community Rules</h2>
      {community.rules.map(
        (_, index) =>
          index % 2 === 0 && (
            <button
              key={index}
              onClick={() => {
                setCurrentRuleIndex(index / 2);
                setOpen(true);
              }}
              className="my-1 flex w-full items-center gap-2 rounded border-2 border-zinc-500 p-1 hover:bg-zinc-700 hover:bg-opacity-20"
            >
              <b>{index / 2 + 1}.</b> {community.rules[index]}
              <span className="ml-auto hidden max-w-[8rem] overflow-hidden overflow-ellipsis whitespace-nowrap text-sm font-normal text-zinc-400 md:block">
                {community.rules[index + 1]}
              </span>
            </button>
          )
      )}
      {community.rules.length === 0 && <>Your community has no rules yet.</>}
      <button
        onClick={() => {
          setCurrentRuleIndex(-1);
          setOpen(true);
        }}
        className="mx-auto mt-4 flex items-center gap-1 rounded bg-indigo-800 py-2 px-3 text-base transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
      >
        <BsPlus className="text-xl" />
        Add rule
      </button>
      <Dialog isOpen={isOpen} close={() => setOpen(false)}>
        <CommunityRuleForm
          community={community}
          index={currentRuleIndex}
          close={() => setOpen(false)}
        />
      </Dialog>
    </div>
  );
};

const createCommunityRuleSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must have at least 2 characters" })
    .max(32, { message: "Title must have at most 32 characters" }),
  content: z
    .string()
    .max(256, { message: "Content must have at most 256 characters" }),
});

export type createCommunityRuleForm = z.infer<typeof createCommunityRuleSchema>;

const CommunityRuleForm: React.FC<{
  community: CommunityReturnType;
  index: number;
  close: () => void;
}> = ({ community, index, close }) => {
  const { control, handleSubmit } = useForm<createCommunityRuleForm>({
    mode: "onChange",
    resolver: zodResolver(createCommunityRuleSchema),
    defaultValues: {
      title: index >= 0 ? community.rules[index * 2 + 0] : "",
      content: index >= 0 ? community.rules[index * 2 + 1] : "",
    },
  });

  const utils = trpc.useContext();
  const editRulesMutation = trpc.community.editCommunityRules.useMutation({
    onSuccess: (data) => {
      utils.community.invalidate();
      utils.community.getCommunity.setData({ name: data.name }, (prev) => {
        if (!prev) return community;
        return { ...prev, ...data };
      });
      close();
    },
  });

  function onSubmit(data: createCommunityRuleForm) {
    const newRules = [...community.rules];
    if (index === -1) {
      newRules.push(data.title, data.content);
    } else {
      newRules[index * 2] = data.title;
      newRules[index * 2 + 1] = data.content;
    }
    editRulesMutation.mutate({ name: community.name, rules: newRules });
  }

  function removeRule() {
    const newRules = [...community.rules];
    newRules.splice(index * 2, 2);

    editRulesMutation.mutate({ name: community.name, rules: newRules });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="m-auto flex w-full max-w-sm flex-col gap-1 border-2 border-zinc-800 bg-zinc-900 px-4 py-0 md:max-w-md md:px-6"
    >
      <h2 className="my-4 text-2xl">
        {index === -1 ? "Create New Rule" : `Edit Rule ${index + 1}`}
      </h2>
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <>
            <div
              className={cx(
                "overflow-hidden text-red-400 transition-all",
                fieldState.error?.message ? "h-8" : "h-0"
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
              placeholder={
                index === -1
                  ? "Title of new rule"
                  : `Title of rule ${index + 1}`
              }
            />
          </>
        )}
      />
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState }) => (
          <>
            <div
              className={cx(
                "overflow-hidden text-red-400 transition-all",
                fieldState.error?.message ? "h-8" : "h-0"
              )}
            >
              {fieldState.error?.message}
            </div>
            <textarea
              autoComplete="off"
              {...field}
              className={cx(
                "h-60 w-full resize-none rounded border-2 bg-transparent p-1 text-zinc-200 outline-none md:h-48",
                fieldState.error
                  ? "border-red-600"
                  : "border-zinc-500 focus:border-zinc-300"
              )}
              placeholder={
                index === -1
                  ? "Content of new rule"
                  : `Content of rule ${index + 1}`
              }
            />
          </>
        )}
      />

      <div className="mt-4 flex w-full justify-center gap-2">
        <button
          type="submit"
          className="w-28 rounded-md bg-indigo-800 p-2 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
          disabled={editRulesMutation.isLoading}
        >
          Save
        </button>
        {index !== -1 && (
          <button
            className="w-28 rounded-md bg-red-800 p-2 text-white transition-colors hover:bg-red-900 disabled:bg-zinc-500"
            type="button"
            disabled={editRulesMutation.isLoading}
            onClick={removeRule}
          >
            Remove rule
          </button>
        )}
      </div>

      <Loading size="small" show={editRulesMutation.isLoading} />
    </form>
  );
};

const CommunityPreview: React.FC<{
  name: string;
  desc: string;
  image: string | null;
  logo: string | null;
}> = ({ name, image, logo, desc }) => {
  return (
    <LinkToCommunity
      community={{ name, image, logo, desc }}
      className="group relative w-full max-w-xs cursor-pointer rounded-md border-2 border-zinc-500 p-2"
    >
      <>
        <div className="absolute inset-0 h-full w-full bg-zinc-200 bg-opacity-0 transition-colors group-hover:bg-opacity-10"></div>
        <div className="bg-rotate relative h-12 w-full bg-gradient-radial from-stone-700 bg-[length:12px_12px] md:h-20">
          {image && (
            <ImageHidesOnError
              loader={({ src }) => src}
              src={image}
              alt={`Community image of ${name}`}
              className="object-cover"
              fill
              priority
            />
          )}
        </div>
        <div className="ml-4 flex -translate-y-1/3 items-center gap-1 text-lg font-bold md:ml-12 md:max-w-3xl">
          <CommunityLogo name={name} logo={logo} size="medium" />
          <span>/b/{name}</span>
        </div>
        <p className="text-xs text-gray-300">{desc}</p>
      </>
    </LinkToCommunity>
  );
};
