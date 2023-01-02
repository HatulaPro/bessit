import type { InferGetServerSidePropsType } from "next";
import {
  getProviders,
  signIn,
  useSession,
  type ClientSafeProvider,
} from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";

export async function getStaticProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}

const CURRENT_PROVIDERS = {
  github: {
    logo: "/provider_logos/github.svg",
    color: "#000000",
  },
  discord: {
    logo: "/provider_logos/discord.svg",
    color: "#7289DA",
  },
  reddit: {
    logo: "/provider_logos/reddit.svg",
    color: "#000000",
  },
  twitch: {
    logo: "/provider_logos/twitch.svg",
    color: "#65459B",
  },
} as const;

const ERRORS: Record<string, string> = {
  Signin: "Try signing with a different account.",
  OAuthSignin: "Try signing with a different account.",
  OAuthCallback: "Try signing with a different account.",
  OAuthCreateAccount: "Try signing with a different account.",
  EmailCreateAccount: "Try signing with a different account.",
  Callback: "Try signing with a different account.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email address.",
  CredentialsSignin:
    "Sign in failed. Check the details you provided are correct.",
  default: "Unable to sign in.",
};

const SignInPage = ({
  providers,
}: InferGetServerSidePropsType<typeof getStaticProps>) => {
  const router = useRouter();
  const session = useSession();
  if (session.status === "authenticated") {
    router.back();
  }
  if (!providers) {
    return <></>;
  }
  const error = router.query?.error as string | undefined;
  const callbackUrl = router.query?.callbackUrl as string;

  return (
    <main className="grid h-full place-items-center pt-12 text-white sm:px-4 md:pt-20">
      <div className="h-full w-full max-w-sm rounded-md bg-zinc-800 py-4 text-center sm:h-auto">
        <Image
          src="/bessit_logo.png"
          alt="Bessit logo"
          className="mx-auto"
          width={112}
          height={112}
        />
        <h1 className="mb-8 mt-2 text-2xl md:text-4xl">Log In to Bessit</h1>
        {error && (
          <span className="text-red-500">
            <b>Error:</b> {ERRORS[error] ?? ERRORS["default"]}
          </span>
        )}
        {(
          Object.keys(CURRENT_PROVIDERS) as (keyof typeof CURRENT_PROVIDERS)[]
        ).map((providerName) => (
          <ProviderButton
            key={providerName}
            provider={providers[providerName]}
            metaData={CURRENT_PROVIDERS[providerName]}
            callbackUrl={callbackUrl}
          />
        ))}
      </div>
    </main>
  );
};

export default SignInPage;

const ProviderButton: React.FC<{
  provider: ClientSafeProvider;
  metaData: typeof CURRENT_PROVIDERS[keyof typeof CURRENT_PROVIDERS];
  callbackUrl: string;
}> = ({ provider, metaData, callbackUrl }) => {
  return (
    <button
      className="text-auto my-2 mx-auto flex w-4/5 items-center justify-evenly rounded-md p-2.5 transition-shadow active:shadow-[inset_0_0rem_0.2rem_#ffffff] md:text-lg"
      style={{ background: metaData.color }}
      onClick={() => signIn(provider.id, { callbackUrl })}
    >
      <Image
        alt={`Logo of ${provider.name}`}
        src={metaData.logo}
        width={36}
        height={36}
      />
      Sign in with {provider.name}
    </button>
  );
};
