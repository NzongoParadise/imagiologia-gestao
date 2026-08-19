"use server";

import { prisma } from "@/lib/db";
import { enviarEmailRecuperacao } from "@/services/email.service";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/**
 * Ação para solicitar a recuperação de password.
 * Gera um token e envia o e-mail de recuperação.
 */
export async function solicitarRecuperacaoPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const utilizador = await prisma.utilizador.findUnique({ where: { email } });

    if (!utilizador) {
      // Por segurança, não revelamos se o e-mail existe ou não.
      return {
        success: true,
        message: "Se um utilizador com este e-mail existir, um link de recuperação será enviado.",
      };
    }

    // Gerar um token seguro
    const token = randomBytes(32).toString("hex");
    const expires = new Date(new Date().getTime() + 3600 * 1000); // Expira em 1 hora

    // Guardar o token na base de dados
    await prisma.passwordResetToken.create({
      data: {
        utilizadorId: utilizador.id,
        token,
        expires,
      },
    });

    // Enviar o e-mail
    await enviarEmailRecuperacao(email, token, utilizador.nome);

    return {
      success: true,
      message: "Se um utilizador com este e-mail existir, um link de recuperação será enviado.",
    };
  } catch (error) {
    console.error("Erro ao solicitar recuperação de password:", error);
    return {
      success: false,
      message: "Ocorreu um erro. Por favor, tente novamente mais tarde.",
    };
  }
}

/**
 * Ação para redefinir a password usando um token válido.
 */
export async function redefinirPassword(
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token, utilizadoEm: null, expires: { gt: new Date() } },
    });

    if (!passwordResetToken) {
      return { success: false, message: "Token inválido ou expirado." };
    }

    // Hash da nova password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar a password do utilizador e marcar o token como utilizado
    await prisma.$transaction([
      prisma.utilizador.update({
        where: { id: passwordResetToken.utilizadorId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: passwordResetToken.id },
        data: { utilizadoEm: new Date() },
      }),
    ]);

    return { success: true, message: "Password redefinida com sucesso!" };
  } catch (error) {
    console.error("Erro ao redefinir password:", error);
    return {
      success: false,
      message: "Ocorreu um erro. Por favor, tente novamente mais tarde.",
    };
  }
}