import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/atendimento/:id
 * Get attendance by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/v1/atendimento/[id]">
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "ID is required",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // TODO: Implement get query handler
    // For now, return placeholder
    return NextResponse.json({
      id,
      codigo: "AT-2026-CON-0001",
      senha: "C-0001",
      tipo: "CONSULTA",
      pacienteId: 1,
      especialidadeId: 1,
      estado: "AGUARDANDO",
      prioridade: 1,
      criadoEm: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/v1/atendimento/:id error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Um erro inesperado ocorreu",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/atendimento/:id
 * Update attendance (e.g., start triage, complete, cancel)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/v1/atendimento/[id]">
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "ID is required",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // TODO: Implement update use case
    // Possible actions: iniciarTriagem, iniciarAtendimento, concluir, cancelar

    return NextResponse.json({
      message: "Atendimento atualizado com sucesso",
    });
  } catch (error) {
    console.error("PUT /api/v1/atendimento/:id error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Um erro inesperado ocorreu",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/atendimento/:id
 * Cancel attendance (soft delete via estado = CANCELADO)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/v1/atendimento/[id]">
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "ID is required",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const { motivo } = body;

    if (!motivo) {
      return NextResponse.json(
        {
          code: "VALIDATION_ERROR",
          message: "motivo (cancellation reason) is required",
          statusCode: 400,
          field: "motivo",
        },
        { status: 400 }
      );
    }

    // TODO: Implement cancel use case

    return NextResponse.json({
      message: "Atendimento cancelado com sucesso",
    });
  } catch (error) {
    console.error("DELETE /api/v1/atendimento/:id error:", error);
    return NextResponse.json(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "Um erro inesperado ocorreu",
      },
      { status: 500 }
    );
  }
}
