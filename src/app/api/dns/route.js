// app/api/verificarDnssec/route.js

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
  
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain parameter is required' }), { status: 400 });
    }
  
    // Simulação de uma lógica de verificação DNSSEC, substitua com sua lógica real
    const result = {
      domain,
      isDnssecValid: domain === 'google.com.br', // Exemplo de validação simples
    };
  
    return new Response(JSON.stringify(result), { status: 200 });
  }
  