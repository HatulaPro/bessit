import type { InferGetServerSidePropsType } from "next";
import {
  getProviders,
  signIn,
  useSession,
  type ClientSafeProvider,
} from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { Loading } from "../../components/Loading";
import { cx } from "../../utils/general";

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
    color: "#ff4500",
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
  const [wasRedirected, setRedirected] = useState<boolean>(false);

  if (router.isReady && session.status === "authenticated") {
    router.push("/");
  }

  if (!providers) {
    return <></>;
  }
  const error = router.query?.error as string | undefined;
  const callbackUrl = router.query?.callbackUrl as string;

  return (
    <>
      <Head>
        <title>Bessit | Sign In </title>
        <meta
          name="description"
          content="Sign in to the Best Reddit alternative on earth, also known as Bessit."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen flex-col items-center justify-center bg-zinc-900 text-white sm:px-4 md:bg-inherit">
        <div className="w-full max-w-md py-4">
          <div className="relative mx-auto w-full overflow-hidden rounded-md bg-zinc-800 py-2 text-center">
            <Image
              src="/bessit_logo.png"
              alt="Bessit logo"
              className="my-2 mx-auto h-12 w-12"
              width={512}
              height={512}
            />
            {error ? (
              <span className="text-red-500">
                <b>Error:</b> {ERRORS[error] ?? ERRORS["default"]}
              </span>
            ) : (
              <span className="text-zinc-300">Sign in with</span>
            )}
            <div
              className={cx(
                "transition-all",
                wasRedirected ? "opacity-1" : "-translate-x-full opacity-0"
              )}
            >
              <LoadingLogin />
            </div>
            <div
              className={cx(
                "grid w-full grid-cols-1 gap-4 p-4 transition-all sm:grid-cols-2 sm:grid-rows-2",
                wasRedirected ? "translate-x-full opacity-0" : "opacity-1"
              )}
            >
              {(
                Object.keys(
                  CURRENT_PROVIDERS
                ) as (keyof typeof CURRENT_PROVIDERS)[]
              ).map((providerName) => (
                <ProviderButton
                  key={providerName}
                  provider={providers[providerName]}
                  metaData={CURRENT_PROVIDERS[providerName]}
                  callbackUrl={callbackUrl}
                  setRedirected={setRedirected}
                />
              ))}
            </div>
          </div>
        </div>
        {/* <button
          onClick={() => router.back()}
          disabled={wasRedirected}
          className="mt-6 rounded-md bg-indigo-600 py-2 px-4 enabled:hover:bg-indigo-700 disabled:bg-zinc-500"
        >
          Cancel
        </button> */}
      </main>
    </>
  );
};

export default SignInPage;

const ProviderButton: React.FC<{
  provider: ClientSafeProvider;
  metaData: typeof CURRENT_PROVIDERS[keyof typeof CURRENT_PROVIDERS];
  callbackUrl: string;
  setRedirected: (x: boolean) => void;
}> = ({ provider, metaData, callbackUrl, setRedirected }) => {
  return (
    <button
      className="text-auto mx-auto flex w-full items-center justify-evenly rounded-md border-2 border-zinc-600 p-1 font-bold transition-shadow active:shadow-[inset_0_0rem_0.2rem_#ffffff] md:text-lg"
      style={{ background: metaData.color }}
      onClick={() => {
        signIn(provider.id, { callbackUrl }).then((res) => {
          if (res && (!res.error || !res.ok)) {
            setRedirected(false);
          }
        });
        setRedirected(true);
      }}
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

const LoadingLogin: React.FC = () => {
  return (
    <div className="absolute left-1/2 mt-12 flex -translate-x-1/2 flex-col items-center justify-center gap-3">
      <Loading show size="large" />
      <h3 className="text-sm text-zinc-300">
        You are currently being redirected...
      </h3>
    </div>
  );
};
