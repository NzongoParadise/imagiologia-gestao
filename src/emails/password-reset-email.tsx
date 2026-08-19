import * as React from "react";

interface PasswordResetEmailProps {
  resetLink: string;
  utilizadorNome?: string | null;
}

/**
 * Template de e-mail para recuperação de password.
 * Utilizado pelo serviço de e-mail (Resend) para enviar o link de reset.
 */
export function PasswordResetEmail({
  resetLink,
  utilizadorNome,
}: PasswordResetEmailProps) {
  const nome = utilizadorNome || "Utilizador";

  return React.createElement(
    "div",
    {
      style: {
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        maxWidth: "560px",
        margin: "0 auto",
        padding: "40px 24px",
        backgroundColor: "#ffffff",
      },
    },
    React.createElement(
      "h1",
      {
        style: {
          fontSize: "24px",
          fontWeight: 700,
          color: "#1a1a2e",
          marginBottom: "16px",
        },
      },
      "Recuperação de Password"
    ),
    React.createElement(
      "p",
      { style: { fontSize: "16px", color: "#4a4a68", lineHeight: "1.6" } },
      `Olá ${nome},`
    ),
    React.createElement(
      "p",
      { style: { fontSize: "16px", color: "#4a4a68", lineHeight: "1.6" } },
      "Recebemos um pedido para redefinir a sua password na plataforma Imagiologia Gestão. Clique no botão abaixo para criar uma nova password:"
    ),
    React.createElement(
      "div",
      { style: { textAlign: "center" as const, margin: "32px 0" } },
      React.createElement(
        "a",
        {
          href: resetLink,
          style: {
            display: "inline-block",
            padding: "14px 32px",
            backgroundColor: "#3b82f6",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: "8px",
          },
        },
        "Redefinir Password"
      )
    ),
    React.createElement(
      "p",
      { style: { fontSize: "14px", color: "#8888a0", lineHeight: "1.6" } },
      "Se não solicitou esta alteração, pode ignorar este e-mail. O link expira em 1 hora."
    ),
    React.createElement("hr", {
      style: { border: "none", borderTop: "1px solid #e5e5ed", margin: "32px 0" },
    }),
    React.createElement(
      "p",
      { style: { fontSize: "12px", color: "#b0b0c0", textAlign: "center" as const } },
      "© Imagiologia Gestão — Sistema de Gestão Hospitalar"
    )
  );
}
