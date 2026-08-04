"use server";

import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/validators/schemas";

export async function realizarLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = loginSchema.safeParse({ email, password });
  if (!validated.success) {
    return { error: "Email ou password inválidos" };
  }

try {
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: true,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { type?: string; digest?: string };
      if (err.type === "CredentialsSignin" || err.message?.includes("CredentialsSignin")) {
        return { error: "Email ou password incorretos" };
      }
      if (err.digest?.includes("NEXT_REDIRECT")) {
        throw error;
      }
    }
    return { error: "Erro ao fazer login. Tente novamente." };
  }
}

export async function realizarLogout() {
  await signOut({ redirectTo: "/login" });
}

