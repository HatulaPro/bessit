import type { RouterOutputs } from "./trpc";
import type { InfiniteData } from "@tanstack/react-query";
import type { Moderator, PostVote, User } from "@prisma/client";

export const GET_POSTS_PLACEHOLDER = {
  pageParams: [undefined],
  pages: [],
} as InfiniteData<RouterOutputs["post"]["getPosts"]>;

export const GET_COMMUNITY_PLACEHOLDER = {
  desc: "",
  id: "",
  image: null,
  logo: null,
  name: "community",
  ownerId: "",
  moderators: [],
  rules: [] as string[],
  _count: {
    members: 0,
  },
  members: [],
} as const;

export const GET_FAVORITE_COMMUNITIES_PLACEHOLDER = [
  {
    userId: "...",
    communityId: "communityId",
    community: {
      ownerId: "...",
      name: "community",
      desc: "words",
      id: "communityId",
      logo: null,
      image: null,
      rules: [],
    },
  },
] as const;

export const GET_TOP_COMMUNITIES_PLACEHOLDER = [
  {
    ownerId: "...",
    name: "community",
    desc: "words",
    id: "communityId",
    logo: null,
    image: null,
    rules: [],
    _count: { members: 1 },
  },
] as const;

export const GET_POST_PLACEHOLDER = {
  communityName: "communityId",
  community: {
    ownerId: "",
    name: "communityName",
    desc: "",
    id: "communityId",
    image: null,
    logo: null,
    moderators: [] as (Moderator & {
      user: User;
    })[],
    rules: [] as string[],
  },
  content: "",
  createdAt: new Date(),
  id: "postId",
  isDeleted: false,
  title: "",
  updatedAt: new Date(),
  user: {
    id: "",
    image: null,
    name: "",
    isGlobalMod: false,
    bannedUntil: new Date(0),
  },
  userId: "",
  votes: [] as PostVote[],
  _count: { comments: 0, votes: 0 },
} as const;

export const GET_COMMENTS_PLACEHOLDER = {
  pages: [],
  pageParams: [],
} as InfiniteData<RouterOutputs["post"]["getComments"]>;
