import { PrismaClient } from "@prisma/client"; // Importa o cliente do Prisma para interagir com o banco de dados
import { NextResponse } from "next/server"; // Importa NextResponse para manipular respostas HTTP
import dns from "dns"; // Importa o módulo DNS para resolver IPs de URLs
import fetch from "node-fetch"; // Para obter código HTTP da URL
import ping from "ping"; // Para testar conectividade via ping
import https from "https"; // Importa o módulo HTTPS para configurar o agente

const prisma = new PrismaClient(); // Instancia o cliente do Prisma

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
        let dnsServerIp = null; // IP do servidor DNS que respondeu
        let isAuthoritative = false; // Se a resposta foi autoritativa

        // Resolve o IP da URL e obtém detalhes do servidor DNS
        try {
          const urlWithoutProtocol = entry.url.replace(/^https?:\/\//, ""); // Remove o protocolo
          const dnsResponse = await new Promise((resolve, reject) => {
            dns.resolve(urlWithoutProtocol, "A", (err, addresses, nsInfo) => {
              if (err) return reject(err);

              resolve({
                addresses: addresses,
                server: nsInfo?.server || "Desconhecido",
                isAuthoritative: nsInfo?.authoritative || false,
              });
            });
          });

          resolvedIp = dnsResponse.addresses?.[0] || null; // Seleciona o primeiro endereço
          dnsServerIp = dnsResponse.server; // IP do servidor DNS que respondeu
          isAuthoritative = dnsResponse.isAuthoritative; // Se a resposta foi autoritativa
          match = resolvedIp === entry.ip; // Compara o IP resolvido com o IP esperado
        } catch {
          resolvedIp = null;
          dnsServerIp = null;
          isAuthoritative = false;
          match = false; // Se não resolver, o IP fica nulo e não há correspondência
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
          dnsServerIp, // IP do servidor DNS que respondeu
          isAuthoritative, // Se a resposta foi autoritativa
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
