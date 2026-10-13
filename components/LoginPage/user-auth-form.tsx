import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { uiTheme } from "@/lib/design-system";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  isLogin: boolean;
  onLoginSuccess?: () => void;
  callbackUrl?: string;
  theme?: typeof uiTheme;
}
export function UserAuthForm({
  className,
  isLogin,
  onLoginSuccess,
  callbackUrl = "/",
  theme,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") || "").trim();
    const password = String(fields.get("password") || "");
    try {
      const response = await fetch(
        `/api/auth/${isLogin ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : {
                  username: String(fields.get("username") || "").trim(),
                  email,
                  password,
                },
          ),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "We couldn’t sign you in. Please try again.",
        );
      login(data.user, data.token);
      if (onLoginSuccess) onLoginSuccess();
      else router.push(callbackUrl);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className={cn("space-y-5", className)} {...props}>
      <form onSubmit={submit} className="space-y-5">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="How the community will know you"
              required
              disabled={isLoading}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            autoCapitalize="none"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            disabled={isLoading}
          />
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <Button type="submit" className="h-12 w-full" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          {isLogin ? "Log in" : "Create account"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full"
        disabled={isLoading}
        onClick={() => signIn("google", { callbackUrl })}
      >
        <Icons.google className="mr-3 h-4 w-4" />
        Google
      </Button>
    </div>
  );
}
