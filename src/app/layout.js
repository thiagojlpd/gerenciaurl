import "./globals.css";

export const metadata = {
  title: "Verificador de resolução de DNS e IP",
  description: "Verifica se a resolução de DNS de uma determinada URL está compatível com o IP previsto para o servidor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        {children}
      </body>
    </html>
  );
}
