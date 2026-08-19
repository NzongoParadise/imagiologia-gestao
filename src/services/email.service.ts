import { Resend } from "resend";
import { PasswordResetEmail } from "@/emails/password-reset-email";

if (!process.env.RESEND_API_KEY) {
  console.warn("Atenção: RESEND_API_KEY não está configurada. Os e-mails não serão enviados.");
}

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL;

export async function enviarEmailRecuperacao(
  email: string,
  token: string,
  utilizadorNome?: string | null
) {
  if (!process.env.RESEND_API_KEY || !fromEmail) {
    console.error("Serviço de e-mail não configurado. Verifique RESEND_API_KEY e RESEND_FROM_EMAIL.");
    // Em desenvolvimento, podemos apenas logar o link para não bloquear o fluxo
    console.log(`Link de recuperação para ${email}: /reset-password?token=${token}`);
    return;
  }

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  return resend.emails.send({
    from: fromEmail,
    to: email,
    subject: "Recuperação de Password - Imagiologia Gestão",
    react: PasswordResetEmail({ resetLink, utilizadorNome }),
  });
}