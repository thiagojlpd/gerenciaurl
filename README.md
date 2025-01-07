Inicializar o Projeto:

fnm env --use-on-cd | Out-String | Invoke-Expression

1. Instalar as Dependências

Abra um terminal e execute o seguinte comando para instalar as dependências:

npm install next prisma @prisma/client pg


2. Configurar o Banco de Dados

Crie um banco de dados PostgreSQL localmente ou em um serviço como o ElephantSQL e copie a URL de conexão.

Em seguida, configure o Prisma:

npx prisma init

Isso criará um arquivo .env e um diretório prisma/.

Abra o arquivo .env e defina a variável DATABASE_URL com a URL de conexão do PostgreSQL:

DATABASE_URL="postgresql://usuario:senha@localhost:5432/seu_banco"


3. Criar o Schema do Prisma

Abra o arquivo prisma/schema.prisma e substitua o conteúdo pelo seguinte:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model UrlEntry {
  id        String   @id @default(uuid())
  url       String   @unique
  ip        String
  createdAt DateTime @default(now())
}

Depois, gere o cliente Prisma:

npx prisma generate

Em seguida, aplique a migração para criar as tabelas no banco de dados:

npx prisma migrate dev --name init


4. Criar a API no Next.js

Crie a pasta app/api/urls e, dentro dela, crie o arquivo route.js com o código fornecido.

Se ainda não tiver um projeto Next.js configurado, execute o seguinte comando:

npx create-next-app@latest meu-projeto

Escolha as configurações padrão ou ajuste conforme necessário.

Depois, entre no diretório do projeto:

cd meu-projeto


5. Criar a Estrutura da API

No Next.js com App Router, as APIs ficam dentro da pasta app/api. Se essa pasta ainda não existir, crie-a com o seguinte comando:

mkdir -p app/api/urls

Agora, dentro de app/api/urls, crie o arquivo route.js e cole o código da API que você já tem.
6. Instalar as Dependências

Dentro do diretório do projeto, instale os pacotes necessários:

npm install prisma @prisma/client pg
npm install

Inicie o servidor de desenvolvimento:

npm run dev

Instale também a dependência para exportação de arquivos Excel:

npm install xlsx
