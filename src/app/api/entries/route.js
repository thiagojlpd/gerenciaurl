import { PrismaClient } from "@prisma/client"; // Importa o cliente do Prisma para interagir com o banco de dados
import { NextResponse } from "next/server"; // Importa NextResponse para manipular respostas HTTP
import dns from "dns/promises"; // Importa o módulo DNS na versão de promessas para resolver IPs

const prisma = new PrismaClient(); // Instancia o cliente do Prisma

// API para salvar URL e IP
export async function POST(req) {
  try {
    const { url, ip } = await req.json(); // Extrai os dados JSON da requisição
    
    if (!url || !ip) {
      return NextResponse.json({ error: "URL e IP são obrigatórios" }, { status: 400 });
    }

    const newEntry = await prisma.urlEntry.create({
      data: { url, ip },
    });
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar no banco", details: error.message }, { status: 500 });
  }
}

// API para listar URLs e validar IP associado
export async function GET() {
  try {
    const entries = await prisma.urlEntry.findMany();
    const results = await Promise.all(entries.map(async (entry) => {
      try {
        const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, '');
        const { address } = await dns.lookup(urlWithoutProtocol);
        return {
          url: entry.url,
          expectedIp: entry.ip,
          resolvedIp: address,
          match: address === entry.ip,
        };
      } catch (error) {
        return {
          url: entry.url,
          expectedIp: entry.ip,
          resolvedIp: null,
          match: false,
          error: "Falha ao resolver o IP",
        };
      }
    }));
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar entradas", details: error.message }, { status: 500 });
  }
}

// API para processar o upload de arquivos de zona DNS
export async function POST_ZONA(req) {
  try {
    const formData = await req.formData(); // Extrai o FormData da requisição
    const file = formData.get('zoneFile'); // Obtém o arquivo enviado
    
    if (!file) {
      return NextResponse.json({ error: "Arquivo de zona DNS não fornecido" }, { status: 400 });
    }

    const content = await file.text(); // Lê o conteúdo do arquivo como texto
    const lines = content.split('\n'); // Divide o conteúdo em linhas
    
    const newEntries = await Promise.all(lines.map(async (line) => {
      const regex = /^(\S+)\s+IN\s+A\s+(\S+)$/; // Regex para identificar entradas A
      const match = line.match(regex);
      
      if (match) {
        const [_, url, ip] = match; // Extrai URL e IP
        try {
          return await prisma.urlEntry.create({ data: { url, ip } }); // Insere a entrada no banco
        } catch (error) {
          console.error(`Erro ao salvar a entrada para ${url}:`, error);
          return null;
        }
      }
      return null;
    }));

    const validEntries = newEntries.filter(entry => entry !== null); // Filtra entradas válidas

    if (validEntries.length === 0) {
      return NextResponse.json({ error: "Nenhuma entrada válida encontrada no arquivo." }, { status: 400 });
    }
    
    return NextResponse.json(validEntries, { status: 201 }); // Retorna as entradas salvas
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar arquivo de zona DNS", details: error.message }, { status: 500 });
  }
}

// API para excluir todos os registros
export async function DELETE() {
  try {
    await prisma.urlEntry.deleteMany(); // Exclui todos os registros da tabela urlEntry
    return NextResponse.json({ message: "Todas as entradas foram excluídas com sucesso" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir todas as entradas", details: error.message }, { status: 500 });
  }
}
