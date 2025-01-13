import { PrismaClient } from "@prisma/client"; // Importa o cliente do Prisma para interagir com o banco de dados
import { NextResponse } from "next/server"; // Importa NextResponse para manipular respostas HTTP, como retornos JSON e status de resposta
import dns from "dns/promises"; // Importa o módulo DNS na versão de promessas para resolver IPs de URLs de forma assíncrona

const prisma = new PrismaClient(); // Instancia o cliente do Prisma, permitindo interações com o banco de dados

// API para salvar URL e IP
export async function POST(req) {
  try {
    const { url, ip } = await req.json(); // Extrai os dados JSON da requisição (a URL e o IP)
    
    if (!url || !ip) {
      // Se a URL ou o IP não estiverem presentes, retorna uma resposta de erro com status 400
      return NextResponse.json({ error: "URL e IP são obrigatórios" }, { status: 400 });
    }

    // Cria uma nova entrada no banco de dados usando o Prisma com os dados recebidos
    const newEntry = await prisma.urlEntry.create({
      data: { url, ip },
    });
    return NextResponse.json(newEntry, { status: 201 }); // Retorna a nova entrada com status 201 (Criado)
  } catch (error) {
    // Se ocorrer algum erro durante o processo, retorna uma resposta de erro com status 500
    return NextResponse.json({ error: "Erro ao salvar no banco", details: error.message }, { status: 500 });
  }
}

// API para listar URLs e validar IP associado
export async function GET() {
  try {
    // Busca todas as entradas da tabela urlEntry no banco de dados usando o Prisma
    const entries = await prisma.urlEntry.findMany();

    // Faz uma resolução de IP para cada entrada usando o DNS
    const results = await Promise.all(entries.map(async (entry) => {
      try {
        const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, ''); // Remove o protocolo (http:// ou https://) da URL
        const { address } = await dns.lookup(urlWithoutProtocol); // Resolve o IP da URL sem o protocolo
        return {
          url: entry.url,
          expectedIp: entry.ip,
          resolvedIp: address, // IP resolvido pelo DNS
          match: address === entry.ip, // Compara o IP resolvido com o esperado
        };
      } catch (error) {
        // Se ocorrer um erro na resolução do IP, retorna o erro e informa que a resolução falhou
        return {
          url: entry.url,
          expectedIp: entry.ip,
          resolvedIp: null,
          match: false,
          error: "Falha ao resolver o IP", // Erro ao resolver o IP
        };
      }
    }));

    return NextResponse.json(results); // Retorna os resultados com status 200 (OK)
  } catch (error) {
    // Se ocorrer um erro ao buscar as entradas, retorna uma resposta de erro com status 500
    return NextResponse.json({ error: "Erro ao buscar entradas", details: error.message }, { status: 500 });
  }
}

// API para processar o upload de arquivos de zona DNS
export async function POST_ZONA(req) {
  try {
    const formData = await req.formData(); // Extrai o FormData da requisição
    const file = formData.get('zoneFile'); // Obtém o arquivo enviado no campo 'zoneFile'
    
    if (!file) {
      // Se não houver arquivo, retorna um erro com status 400
      return NextResponse.json({ error: "Arquivo de zona DNS não fornecido" }, { status: 400 });
    }

    const content = await file.text(); // Lê o conteúdo do arquivo como texto
    const lines = content.split('\n'); // Divide o conteúdo do arquivo em linhas
    
    // Processa cada linha e tenta criar uma entrada no banco de dados
    const newEntries = await Promise.all(lines.map(async (line) => {
      const regex = /^(\S+)\s+IN\s+A\s+(\S+)$/; // Regex para identificar entradas de tipo A (URL e IP)
      const match = line.match(regex);
      
      if (match) {
        const [_, url, ip] = match; // Extrai a URL e o IP da linha que corresponde ao regex
        try {
          // Cria a entrada no banco de dados usando o Prisma
          return await prisma.urlEntry.create({ data: { url, ip } });
        } catch (error) {
          console.error(`Erro ao salvar a entrada para ${url}:`, error); // Caso ocorra erro ao salvar, exibe no console
          return null;
        }
      }
      return null; // Retorna null caso a linha não corresponda ao formato esperado
    }));

    const validEntries = newEntries.filter(entry => entry !== null); // Filtra entradas válidas (não nulas)

    if (validEntries.length === 0) {
      // Se nenhuma entrada válida foi encontrada no arquivo, retorna um erro com status 400
      return NextResponse.json({ error: "Nenhuma entrada válida encontrada no arquivo." }, { status: 400 });
    }
    
    return NextResponse.json(validEntries, { status: 201 }); // Retorna as entradas válidas com status 201 (Criado)
  } catch (error) {
    // Se ocorrer um erro ao processar o arquivo, retorna um erro com status 500
    return NextResponse.json({ error: "Erro ao processar arquivo de zona DNS", details: error.message }, { status: 500 });
  }
}

// API para excluir todos os registros
export async function DELETE() {
  try {
    // Exclui todas as entradas da tabela urlEntry usando o Prisma
    await prisma.urlEntry.deleteMany(); 
    return NextResponse.json({ message: "Todas as entradas foram excluídas com sucesso" }, { status: 200 }); // Retorna uma mensagem de sucesso com status 200 (OK)
  } catch (error) {
    // Se ocorrer um erro ao excluir as entradas, retorna uma resposta de erro com status 500
    return NextResponse.json({ error: "Erro ao excluir todas as entradas", details: error.message }, { status: 500 });
  }
}
