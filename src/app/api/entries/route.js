import { PrismaClient } from "@prisma/client"; // Importa o cliente do Prisma para interagir com o banco de dados
import { NextResponse } from "next/server"; // Importa NextResponse para manipular respostas HTTP
import dns from "dns/promises";  // Importa o módulo DNS na versão de promessas para resolver IPs

const prisma = new PrismaClient(); // Instancia o cliente do Prisma

// API para salvar URL e IP
export async function POST(req) {
  const { url, ip } = await req.json(); // Extrai os dados JSON da requisição
  
  // Verifica se os campos URL e IP foram fornecidos
  if (!url || !ip) {
    return NextResponse.json({ error: "URL e IP são obrigatórios" }, { status: 400 });
  }

  try {
    // Cria uma nova entrada no banco de dados com URL e IP
    const newEntry = await prisma.urlEntry.create({
      data: { url, ip },
    });
    return NextResponse.json(newEntry, { status: 201 }); // Retorna a entrada criada com status 201 (Criado)
  } catch (error) {
    // Retorna erro caso falhe ao salvar
    return NextResponse.json({ error: "Erro ao salvar no banco" }, { status: 500 });
  }
}

// API para listar URLs e validar IP associado
export async function GET() {
  const entries = await prisma.urlEntry.findMany(); // Busca todas as entradas no banco de dados
  let results = [];

  for (const entry of entries) {
    try {
      // Remove o prefixo http:// ou https:// antes de tentar resolver o IP
      const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, '');
      
      // Resolve o IP usando dns.lookup (sem fazer requisição HTTP)
      const { address } = await dns.lookup(urlWithoutProtocol);

      // Verifica se o IP resolvido corresponde ao IP cadastrado
      const match = address === entry.ip;

      results.push({
        url: entry.url,
        expectedIp: entry.ip, // IP armazenado no banco
        resolvedIp: address, // IP resolvido pelo DNS
        match, // Booleano indicando se os IPs coincidem
      });
    } catch (error) {
      console.error(`Falha ao resolver ${entry.url}:`, error);
      results.push({
        url: entry.url,
        expectedIp: entry.ip,
        resolvedIp: null,
        match: false,
        error: "Falha ao resolver o IP", // Indica erro ao resolver DNS
      });
    }
  }

  return NextResponse.json(results); // Retorna a lista de URLs com a validação dos IPs
}

// API para processar o upload de arquivos de zona DNS
export async function POST_ZONA(req) {
  const formData = await req.formData(); // Pega o arquivo enviado
  const file = formData.get('zoneFile'); // O arquivo é extraído do FormData
  
  if (!file) {
    return NextResponse.json({ error: "Arquivo de zona DNS não fornecido" }, { status: 400 });
  }

  const content = await file.text(); // Lê o conteúdo do arquivo como texto
  const lines = content.split('\n'); // Divide o arquivo em linhas
  
  let newEntries = [];

  for (const line of lines) {
    // Regex para capturar registros do tipo A (domínio e IP esperado)
    const regex = /(\S+)\s+IN\s+A\s+(\S+)/;
    const match = line.match(regex);
    
    if (match) {
      const url = match[1]; // Nome do domínio
      const ip = match[2];  // IP esperado

      try {
        // Tenta salvar a nova entrada no banco de dados
        const newEntry = await prisma.urlEntry.create({
          data: { url, ip },
        });
        newEntries.push(newEntry);
      } catch (error) {
        console.error(`Erro ao salvar a entrada para ${url}:`, error);
      }
    }
  }

  if (newEntries.length === 0) {
    return NextResponse.json({ error: "Nenhuma entrada válida encontrada no arquivo." }, { status: 400 });
  }

  return NextResponse.json(newEntries, { status: 201 }); // Retorna as entradas salvas com sucesso
}
