import { notFound } from "next/navigation";

import ForgotPasswordPage from "@/components/auth/forgot-password-page";
import LoginPage from "@/components/auth/login-page";
import ResetPasswordPage from "@/components/auth/reset-password-page";
import SignupPage from "@/components/auth/signup-page";

type Mode = "login" | "signup" | "forgot-password" | "reset-password";

export default function AuthModePage({ params }: { params: { mode: string } }) {
  const mode = params.mode as Mode;

  if (mode === "login") return <LoginPage />;
  if (mode === "signup") return <SignupPage />;
  if (mode === "forgot-password") return <ForgotPasswordPage />;
  if (mode === "reset-password") return <ResetPasswordPage />;

  notFound();
}

