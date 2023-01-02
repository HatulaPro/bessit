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
  const [wasRedirected, setRedirected] = useState<boolean>(false);

  if (session.status === "authenticated") {
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
      <main className="h-[600px] pt-12 text-white sm:px-4 md:pt-20">
        <div className="relative mx-auto h-full w-full max-w-sm overflow-hidden rounded-md bg-zinc-800 py-4 text-center">
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
          <div
            className="absolute top-1/2 w-full transition-all"
            style={{
              transform: wasRedirected ? "translateY(0%)" : "translateY(200%)",
              opacity: wasRedirected ? 1 : 0,
            }}
          >
            <LoadingLogin />
          </div>
          <div
            className="absolute w-full transition-all"
            style={{
              transform: wasRedirected ? "translateY(200%)" : "translateY(0%)",
              opacity: wasRedirected ? 0 : 1,
            }}
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
      className="text-auto my-2 mx-auto flex w-4/5 items-center justify-evenly rounded-md p-2.5 transition-shadow active:shadow-[inset_0_0rem_0.2rem_#ffffff] md:text-lg"
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
    <div className="flex flex-col items-center justify-center gap-3">
      <Loading show size="large" />
      <h3 className="text-lg">You are currently being redirected...</h3>
    </div>
  );
};
