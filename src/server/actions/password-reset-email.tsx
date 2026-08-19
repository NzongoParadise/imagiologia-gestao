import * as React from "react";

interface PasswordResetEmailProps {
  resetLink: string;
  utilizadorNome?: string | null;
}

export const PasswordResetEmail: React.FC<Readonly<PasswordResetEmailProps>> = ({
  resetLink,
  utilizadorNome,
}) => (
  <div style={container}>
    <h1 style={heading}>Recuperação de Password</h1>
    <p style={paragraph}>Olá{utilizadorNome ? `, ${utilizadorNome}` : ""},</p>
    <p style={paragraph}>
      Recebemos um pedido para redefinir a sua password. Clique no botão abaixo
      para continuar. Se não fez este pedido, pode ignorar este e-mail.
    </p>
    <a href={resetLink} target="_blank" style={button}>
      Redefinir Password
    </a>
    <p style={paragraph}>
      O link expira em 1 hora.
    </p>
    <hr style={hr} />
    <p style={footer}>Imagiologia Gestão</p>
  </div>
);

// Estilos simples para o e-mail
const container: React.CSSProperties = {
  fontFamily: "sans-serif",
  padding: "20px",
  backgroundColor: "#f4f4f4",
};
const heading: React.CSSProperties = { color: "#333" };
const paragraph: React.CSSProperties = { fontSize: "16px", color: "#555" };
const button: React.CSSProperties = {
  display: "inline-block",
  padding: "12px 24px",
  backgroundColor: "#007bff",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "5px",
  marginTop: "20px",
};
const hr: React.CSSProperties = { borderColor: "#cccccc", margin: "20px 0" };
const footer: React.CSSProperties = { fontSize: "12px", color: "#999" };