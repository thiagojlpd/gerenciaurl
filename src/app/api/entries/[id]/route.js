import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

// Instancia o cliente do Prisma
const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  // Acessa o parâmetro id da URL
  const { id } = await params; 

  try {
    console.log(id)
    // Exclui a entrada com o id fornecido
    const deletedEntry = await prisma.urlEntry.delete({
      where: {
        id: id, // Se o id for do tipo UUID, não precisa de conversão
      },
    });

    // Retorna uma resposta de sucesso caso a exclusão seja bem-sucedida
    return NextResponse.json({ message: 'Entrada excluída com sucesso!' }, { status: 200 });
  } catch (error) {
    // Faz o log do erro caso ocorra
    console.error('Erro ao excluir a entrada:', error);
    return NextResponse.json({ message: `Erro ao excluir a entrada.` }, { status: 500 });
  }
}
