import { PrismaClient } from "@prisma/client"; // Importa o cliente do Prisma para interagir com o banco de dados
import { NextResponse } from "next/server"; // Importa NextResponse para manipular respostas HTTP, como retornos JSON e status de resposta
import dns from "dns/promises"; // Importa o módulo DNS na versão de promessas para resolver IPs de URLs de forma assíncrona
import fetch from "node-fetch"; // Para obter código HTTP da URL
import ping from "ping"; // Para testar conectividade via ping
import https from 'https'; // Importa o módulo HTTPS para configurar o agente
import { exec } from "child_process";

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



// Função para executar o comando nslookup
function nslookup(url) {
  return new Promise((resolve, reject) => {
    exec(`nslookup ${url}`, (error, stdout, stderr) => {
      if (error) {
        return reject(`Erro ao executar nslookup: ${stderr}`);
      }

      // Parse a saída do nslookup
      const serverMatch = stdout.match(/Server:\s+(.+)/i); // 'i' para ignorar maiúsculas/minúsculas
      const addressMatch = stdout.match(/Address:\s+([^\s]+)/); // Captura apenas o endereço

      resolve({
        dnsServerUsed: serverMatch ? serverMatch[1].trim() : "Não encontrado",
        serverAddress: addressMatch ? addressMatch[1].trim() : "Não encontrado",
        output: stdout, // Saída completa do nslookup
      });

    });
  });
}


async function getTitleFromUrl(url) {
  try {
    // Garantir que a URL tenha o protocolo (http:// ou https://)
    if (!/^https?:\/\//i.test(url)) {
      url = `http://${url}`; // Adiciona http:// se não estiver presente
    }

    const response = await fetch(url, { method: "GET" });

    // Verifica se a resposta foi bem-sucedida (status 200)
    if (!response.ok) {
      return `Erro ao acessar a URL: ${response.statusText}`;
    }

    const html = await response.text();
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);

    return titleMatch ? titleMatch[1].trim() : "Título não encontrado";
  } catch (error) {
    console.error(`Erro ao obter título de ${url}:`, error);
    return `Erro ao obter título: ${error.message}`;
  }
}




// API para listar URLs e validar IP associado
export async function GET() {
  try {
    // Busca todas as entradas da tabela urlEntry no banco de dados
    const entries = await prisma.urlEntry.findMany();

    // Processa cada entrada para obter informações adicionais
    const results = await Promise.all(
      entries.map(async (entry) => {
        let resolvedIp = null;
        let match = false;
        let httpStatus = ""; // Inicializa httpStatus como uma string vazia
        let pingExpectedIp = false;
        let pingResolvedIp = false;
        let nslookupResult = null;

        // Resolve o IP da URL
        try {
          const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, ""); // Remove protocol
          const { address } = await dns.lookup(urlWithoutProtocol);
          resolvedIp = address;
          match = address === entry.ip; // Compara o IP resolvido com o IP esperado
        } catch {
          resolvedIp = null;
          match = false;
        }

        // Executa nslookup para obter informações adicionais
        try {
          nslookupResult = await nslookup(entry.url);
        } catch (error) {
          nslookupResult = { error: error.message };
        }

        // Obtém o código HTTP da URL
        try {
          let httpUrl = entry.url.startsWith("http") ? entry.url : `http://${entry.url}`;
          const response = await fetch(httpUrl, { method: "HEAD" });
          httpStatus = `HTTP ${response.status}`; // Atribui o código HTTP ao httpStatus
        } catch (error) {
          console.error(`Erro ao obter status HTTP para ${entry.url}:`, error);
          httpStatus = "HTTP falhou"; // Se falhar, define como "HTTP falhou"
        }

        // Obtém o código HTTPS da URL
        try {
          let httpsUrl = entry.url.startsWith("https") ? entry.url : `https://${entry.url}`;
          const agent = new https.Agent({ rejectUnauthorized: false });
          const response = await fetch(httpsUrl, { method: "HEAD", agent });
          httpStatus += ` | HTTPS ${response.status}`; // Adiciona o status HTTPS ao httpStatus
        } catch (error) {
          console.error(`Erro ao obter status HTTPS para ${entry.url}:`, error);
          httpStatus += error.message.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE")
            ? " | HTTPS autoassinado" // Se erro de certificado, adiciona "autoassinado"
            : " | HTTPS falhou"; // Se falhar, define como "HTTPS falhou"
        }

        // Testa ping no IP esperado
        let pingExpectedIpStatus = "Sem IP esperado";
        if (entry.ip) {
          const pingResponse = await ping.promise.probe(entry.ip); // Verifica a conectividade com o IP esperado
          pingExpectedIpStatus = pingResponse.alive ? "Pingou" : "Não pingou"; // Se respondeu ao ping, marca como "Pingou"
        }

        // Testa ping no IP resolvido, se existir
        let pingResolvedIpStatus = "Sem IP resolvido";
        if (resolvedIp) {
          const pingResponse = await ping.promise.probe(resolvedIp); // Verifica a conectividade com o IP resolvido
          pingResolvedIpStatus = pingResponse.alive ? "Pingou" : "Não pingou"; // Se respondeu ao ping, marca como "Pingou"
        }

        return {
          url: entry.url,
          expectedIp: entry.ip,
          resolvedIp,
          nslookup: nslookupResult,
          match,
          httpStatus, // Contém o status HTTP e HTTPS
          pingExpectedIp: pingExpectedIpStatus, // Ping no IP esperado
          pingResolvedIp: pingResolvedIpStatus, // Ping no IP resolvido
        };
      })
    );

    return NextResponse.json(results); // Retorna os resultados da verificação
  } catch (error) {
    // Se ocorrer algum erro, retorna uma resposta de erro com status 500
    return NextResponse.json(
      { error: "Erro ao buscar entradas", details: error.message },
      { status: 500 }
    );
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
      const match = line.match(regex); // Aplica regex para verificar se a linha está no formato correto

      if (match) {
        const [_, url, ip] = match; // Extrai a URL e o IP da linha que corresponde ao regex
        try {
          // Cria a entrada no banco de dados usando o Prisma
          return await prisma.urlEntry.create({ data: { url, ip } });
        } catch (error) {
          console.error(`Erro ao salvar a entrada para ${url}:`, error); // Caso ocorra erro ao salvar, exibe no console
          return null; // Retorna null se houver erro ao salvar
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



////////////////////////////////////////////////////
// SECURITY

export async function verificarDnssec(domain) {
  try {
    // Realiza a consulta DNS
    const registros = await dns.resolve(domain, 'ANY');

    // Filtra registros DNSSEC (exemplo com RRSIG)
    const registrosDnssec = registros.filter((registro) => typeof registro === 'object' && registro.type === 'RRSIG');

    const resposta = registrosDnssec.length > 0 
      ? { status: "sucesso", mensagem: "DNSSEC assinado", registros: registrosDnssec }
      : { status: "sucesso", mensagem: "DNSSEC não assinado", registros: [] };

    return JSON.stringify(resposta);

  } catch (error) {
    console.error('Erro ao verificar DNSSEC:', error);
    return JSON.stringify({
      status: "erro",
      mensagem: "Erro ao verificar DNSSEC",
      detalhes: error.message,
    });
  }
}



