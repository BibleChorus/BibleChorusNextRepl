import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { UserAuthForm } from "@/components/LoginPage/user-auth-form";
import { ScriptureScroll } from "@/components/LoginPage/scripture-scroll";
import { TermsDialog } from "@/components/LoginPage/terms-dialog";
import { PrivacyDialog } from "@/components/LoginPage/privacy-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { uiTheme } from "@/lib/design-system";

function AuthenticationPage() {
  const router = useRouter();
  const isLogin = router.query.view !== "signup";
  const [redirect, setRedirect] = useState("/");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("loginRedirectPath");
      localStorage.removeItem("loginRedirectPath");
      if (saved?.startsWith("/") && !saved.startsWith("//")) setRedirect(saved);
    } catch {
      /* A normal sign-in still returns home. */
    }
  }, []);
  return (
    <>
      <Head>
        <title>
          {isLogin ? "Welcome back" : "Join the community"} | BibleChorus
        </title>
        <meta
          name="description"
          content="Sign in to share songs, build playlists, and tell your journey of faith through music."
        />
      </Head>
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/biblechorus-icon.png" width={32} height={32} alt="" />
            <span className="font-serif text-xl">BibleChorus</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
        </header>
        <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-2 lg:gap-20">
          <section className="hero-art hidden overflow-hidden rounded-3xl border border-border p-8 lg:block">
            <p className="page-eyebrow flex items-center gap-2">
              <BookOpen className="h-4 w-4" />A little room for the Word
            </p>
            <h2 className="mb-7 text-4xl leading-snug">
              Let it dwell
              <br />
              in you richly.
            </h2>
            <div className="h-[420px] overflow-hidden">
              <ScriptureScroll theme={uiTheme} />
            </div>
          </section>
          <section className="mx-auto w-full max-w-md self-center">
            <p className="page-eyebrow">Welcome to BibleChorus</p>
            <h1 className="text-4xl sm:text-5xl">
              {isLogin ? "Good to have you back." : "Bring your voice."}
            </h1>
            <p className="mb-8 mt-4 text-muted-foreground">
              {isLogin
                ? "Your music, your collections, your journey. Pick up where you left off."
                : "A place to discover scripture songs, share what you create, and grow together."}
            </p>
            <UserAuthForm
              isLogin={isLogin}
              onLoginSuccess={() => router.push(redirect)}
              callbackUrl={redirect}
              theme={uiTheme}
            />
            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isLogin ? "New here?" : "Already part of the community?"}{" "}
              <Link
                href={`/login?view=${isLogin ? "signup" : "login"}`}
                className="font-semibold text-primary hover:underline"
              >
                {isLogin ? "Create an account" : "Log in"}
              </Link>
            </p>
            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing, you agree to our{" "}
              <TermsDialog>
                <button className="underline underline-offset-2">
                  Terms of Service
                </button>
              </TermsDialog>{" "}
              and{" "}
              <PrivacyDialog>
                <button className="underline underline-offset-2">
                  Privacy Policy
                </button>
              </PrivacyDialog>
              .
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
AuthenticationPage.disableLayout = true;
export default AuthenticationPage;
