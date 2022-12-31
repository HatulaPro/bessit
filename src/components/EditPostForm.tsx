import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import type { CommunityPosts } from "../hooks/useCommunityPosts";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";
import { Loading } from "./Loading";
import { Markdown } from "./Markdown";
import { Tabs } from "./Tabs";

const editPostSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Title must have at least 2 characters" })
    .max(256, { message: "Title must have at most 256 characters" }),
  content: z
    .string()
    .max(4096, { message: "Content must have at most 4096 characters" }),
});
export type editPostForm = z.infer<typeof editPostSchema>;
export const EditPostForm: React.FC<{
  post: CommunityPosts["posts"][number];
  close: () => void;
}> = ({ post, close }) => {
  const { control, handleSubmit, formState } = useForm<editPostForm>({
    mode: "onTouched",
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      content: post.content,
      title: post.title,
    },
  });

  const editPostMutation = trpc.post.editPost.useMutation();
  const utils = trpc.useContext();

  const onSubmit = (data: editPostForm) => {
    editPostMutation.mutate({ ...data, postId: post.id });
    utils.post.getPosts.invalidate();
    utils.post.getPost.setData({ post_id: post.id }, () => ({
      ...post,
      ...data,
    }));
    close();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="my-auto flex w-full max-w-3xl flex-col items-center gap-1 rounded border-2 border-transparent bg-zinc-900 p-2 text-white md:border-zinc-800 md:p-4"
    >
      <div className="flex w-full items-center">
        <h2 className="my-2 w-full text-lg text-white md:text-2xl">
          Update Post
        </h2>
        <button
          type="submit"
          className="text-md w-16 rounded bg-indigo-700 p-2 text-white disabled:bg-indigo-500 disabled:text-gray-400 md:w-24 md:text-lg"
          disabled={!formState.isValid || editPostMutation.isLoading}
        >
          Save
        </button>
      </div>
      <Loading size="small" show={editPostMutation.isLoading} />
      <hr className="my-2 w-full" />
      <div className="visible flex max-h-[250vh] w-full origin-top scale-y-100 flex-col gap-2 transition-all">
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
                placeholder="Title"
              />
            </>
          )}
        />
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <Tabs
              defaultValue="editor"
              data={{
                editor: (
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
                        "max-h-[50vh] min-h-[2.4rem] w-full overflow-y-scroll rounded border-2 bg-transparent p-1 text-zinc-200 outline-none",
                        fieldState.error
                          ? "border-red-600"
                          : "border-zinc-500 focus:border-zinc-300"
                      )}
                      placeholder="Your awesome post"
                    ></textarea>
                  </>
                ),
                preview: <Markdown source={field.value} />,
              }}
            />
          )}
        />
      </div>
    </form>
  );
};
