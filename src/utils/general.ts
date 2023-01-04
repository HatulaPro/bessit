export const cx = (...args: (string | boolean | null | undefined)[]) => {
  return args.filter((x) => x).join(" ");
};

export const timeAgo = (date: Date): string => {
  const now = new Date().getTime();
  const millisDiff = now - date.getTime();

  const seconds = millisDiff / 1000;
  if (seconds < 60) return `${Math.floor(seconds)}sec`;

  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}min`;

  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}hr`;

  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d`;

  const months = days / 30.5;
  if (months < 12) return `${Math.floor(months)}mo`;

  const years = months / 12;
  return `${Math.floor(years)}y`;
};

const slugCache = new Map<string, string>();
export const slugify = (sentence: string): string => {
  const cachedValue = slugCache.get(sentence);
  if (cachedValue) return cachedValue;
  const newValue = sentence.replaceAll(/[ \/#\?=]/g, "-");
  slugCache.set(sentence, newValue);
  return newValue;
};

export const FIND_COMMUNITIES_REGEX = /(^|\s)(\/b\/[a-z0-9_]{2,24})($|\s)/gm;
export const FIND_USERS_REGEX =
  /(^|\s)(\/u\/([a-zA-Z0-9\.@*\$\/\\\#]{2,32}|\(([^ ][a-zA-Z0-9\.@*\$\/\\\# ]{1,32})\)))($|\s)/gm;
