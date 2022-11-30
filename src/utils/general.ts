export const cx = (...args: (string | boolean)[]) => {
  return args.filter((x) => x).join(" ");
};
