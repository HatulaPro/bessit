import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { cx } from "../utils/general";
import { trpc } from "../utils/trpc";
import { Loading } from "./Loading";
import { NotBannedOnlyButton } from "./NotBannedOnlyButton";

const createCommentSchema = z.object({
  content: z
    .string()
    .min(4, { message: "Comment must be at least 4 characters long" })
    .max(4096, { message: "Comment must be at most 4096 characters long" }),
});
type createCommentForm = z.infer<typeof createCommentSchema>;

export const CreateCommentForm: React.FC<{
  postId: string;
  parentCommentId: string | null;
  commentContent: string;
  setCurrentParentCommentId: (x: string | null) => void;
  editOrCreate: "edit" | "create";
  close?: () => void;
}> = ({
  postId,
  parentCommentId,
  setCurrentParentCommentId,
  editOrCreate,
  commentContent,
  close,
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { control, handleSubmit, reset } = useForm<createCommentForm>({
    mode: "onSubmit",
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: commentContent,
    },
  });
  const utils = trpc.useContext();
  const createCommentMutation = trpc.post.createComment.useMutation({
    onSuccess: (data) => {
      setCurrentParentCommentId(data.id);
      utils.post.getComments.invalidate();
      reset({ content: commentContent });
    },
  });

  const editCommentMutation = trpc.post.editComment.useMutation({
    onSuccess: (data) => {
      setCurrentParentCommentId(data.id);
      if (close) close();
      utils.post.getComments.invalidate();
      reset({ content: commentContent });
    },
  });

  const onSubmit = (data: createCommentForm) => {
    if (editOrCreate === "create") {
      createCommentMutation.mutate({
        postId,
        content: data.content,
        parentCommentId,
      });
    } else {
      if (parentCommentId === null) return;
      editCommentMutation.mutate({
        commentId: parentCommentId,
        content: data.content,
      });
    }
  };

  return (
    <div
      className={cx(
        "mx-auto w-full max-w-3xl rounded bg-zinc-800 md:max-w-5xl",
        parentCommentId === null ? "my-2 p-3" : "grow-on-mount"
      )}
    >
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="content"
          render={({ field, fieldState }) => (
            <>
              <div
                className={cx(
                  "overflow-hidden text-red-400 transition-all",
                  fieldState.isDirty && fieldState.error?.message
                    ? "h-8"
                    : "h-0"
                )}
              >
                {fieldState.isDirty && fieldState.error?.message}
              </div>
              <textarea
                autoComplete="off"
                {...field}
                className={cx(
                  "max-h-[50vh] min-h-[5rem] w-full overflow-y-scroll rounded border-2 bg-transparent p-1 text-zinc-200 outline-none disabled:contrast-50",
                  fieldState.isDirty && fieldState.error
                    ? "border-red-600"
                    : "border-zinc-500 focus:border-zinc-300"
                )}
                placeholder="Your nice, helpful and engaging comment"
                disabled={
                  createCommentMutation.isLoading ||
                  editCommentMutation.isLoading
                }
              ></textarea>
            </>
          )}
        />
        <div className="ml-auto flex w-32 justify-end">
          <Loading
            show={
              createCommentMutation.isLoading || editCommentMutation.isLoading
            }
            size="small"
          />
          <NotBannedOnlyButton
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
            Child={(props) => (
              <button
                {...props}
                disabled={
                  createCommentMutation.isLoading ||
                  editCommentMutation.isLoading
                }
                type="button"
                className="my-2 w-24 rounded-md bg-indigo-800 p-2 text-white transition-colors hover:bg-indigo-900 disabled:bg-zinc-500"
              >
                {editOrCreate === "create" ? "Submit" : "Save"}
              </button>
            )}
          />
        </div>
      </form>
    </div>
  );
};
