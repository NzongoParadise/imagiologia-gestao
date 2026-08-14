import { NextRequest, NextResponse } from "next/server";
import { CriarAtendimentoUseCase } from "@/application/atendimento/use-cases/CriarAtendimentoUseCase";
import { CriarAtendimentoRequest, AtendimentoResponse } from "@/application/atendimento/dto";
import { ValidationException, BusinessException } from "@/domain/shared/exceptions/DomainException";

/**
 * POST /api/v1/atendimento
 * Create new attendance (consultation or emergency)
 * 
 * Request body:
 * {
 *   "pacienteId": 1,
 *   "especialidadeId": 1,
 *   "tipo": "CONSULTA",
 *   "prioridade": 1
 * }
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "codigo": "AT-2026-CON-0001",
 *   "senha": "C-0001",
 *   "tipo": "CONSULTA",
 *   ...
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and parse request body
    const body = await request.json();
    const input: CriarAtendimentoRequest = body;

    // 2. Instantiate use case
    const useCase = new CriarAtendimentoUseCase();

    // 3. Execute
    const resultado = await useCase.execute(input);

    // 4. Handle result
    if (resultado.isSuccess()) {
      return NextResponse.json(resultado.getOrElse(), { status: 201 });
    } else {
      const error = resultado.error;

      // Handle specific exception types
      if (error instanceof ValidationException) {
        return NextResponse.json(
          {
            code: error.code,
            message: error.message,
            field: error.field,
            statusCode: error.statusCode,
          },
          { status: error.statusCode }
        );
      }

      if (error instanceof BusinessException) {
        return NextResponse.json(
          {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
          },
          { status: error.statusCode }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          code: "INTERNO_ERROR",
          message: error.message,
          statusCode: 500,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Unexpected error
    console.error("POST /api/v1/atendimento error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Um erro inesperado ocorreu",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/atendimento
 * List attendances (with pagination and filters)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement list query handler
    // For now, return placeholder
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/atendimento error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Um erro inesperado ocorreu",
      },
      { status: 500 }
    );
  }
}
