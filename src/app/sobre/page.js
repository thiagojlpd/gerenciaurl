'use client'; // Indica que este código deve ser executado no lado do cliente, não no servidor

import { Card } from 'primereact/card';
import { Menubar } from 'primereact/menubar';
import { useRouter } from 'next/navigation';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '../globals.css';

// Função principal da página
export default function HomePage() {
    const router = useRouter();

    const handleAboutNavigation = () => {
        router.push('/sobre'); // Navega para a página "/sobre"
    };

    const handleAHomeNavigation = () => {
        router.push('/'); // Navega para a página "/sobre"
    };

    const handleADnsNavigation = () => {
        router.push('/dns'); // Navega para a página "/sobre"
    };

    const handleCapaNavigation = () => {
        router.push('/capa'); // Navega para a página "/sobre"
    };


    // Renderiza a interface de usuário
    return (
        <div className="app-container">
            <Menubar model={[{ label: 'URL', icon: 'pi pi-sync', command: handleAHomeNavigation }, { label: 'DNS', icon: 'pi pi-share-alt', command: handleADnsNavigation }, { label: 'Sobre', icon: 'pi pi-info-circle', command: handleAboutNavigation }, { label: 'Capa', icon: 'pi pi-info-circle', command: handleCapaNavigation }]} className="menu-bar" />
            <p />
            <Card title="Sobre o gerenciamento de URL e análise de DNS" className="p-mt-4 card-transparent">
                <div class="container">
                    <header>
                        <h2>Segurança da Informação e Gerenciamento de Configuração de TI: Análise dos Arquivos de Zona do DNS</h2>
                    </header>

                    <main>
                        <p>A segurança da informação e o gerenciamento de configuração de TI são aspectos fundamentais para garantir a integridade, disponibilidade e confidencialidade das informações dentro de uma organização. Um dos componentes essenciais nesse processo é o Sistema de Nomes de Domínio (DNS), que é responsável por mapear nomes de domínio para endereços IP, permitindo a comunicação entre dispositivos na rede. A análise dos arquivos de zona do DNS desempenha um papel crucial na detecção de vulnerabilidades e na validação das configurações de rede.</p>

                        <h3>Verificação da Conformidade entre o IP Resolvido e o IP Registrado</h3>
                        <p>Ao realizar uma análise dos arquivos de zona do DNS, é vital verificar se o endereço IP retornado pelo processo de resolução de nomes corresponde ao IP previamente registrado no cadastro. A integridade da resolução DNS é uma parte essencial para garantir que os usuários ou sistemas que acessam uma aplicação estejam se conectando ao servidor correto. A divergência entre o IP previsto e o IP resolvido pode indicar um erro de configuração ou até mesmo um ataque de envenenamento de cache DNS.</p>

                        <h3>Teste de Conectividade: Ping e Resposta de Requisição</h3>
                        <p>Outro aspecto importante da análise é a verificação da conectividade dos IPs. Utilizar o comando de ping para testar se o IP devolvido pelo DNS é acessível é uma prática essencial para garantir que o servidor respondente está online e funcional. Igualmente, o ping no IP previsto, com a mesma finalidade, assegura que o servidor conforme registrado no cadastro esteja operacional. Esses testes são importantes para validar que as configurações DNS estão alinhadas com a realidade da rede.</p>
                        <p>Além disso, é necessário avaliar as respostas das requisições HTTP/HTTPS. O código de status 200 (OK) deve ser retornado quando o servidor e a aplicação estão funcionando corretamente. Caso o código de resposta seja diferente, como 4xx (erro do cliente) ou 5xx (erro do servidor), pode ser um indicativo de falhas de configuração ou problemas de comunicação entre o cliente e o servidor.</p>

                        <h3>Importância da Avaliação de Segurança no DNS:</h3>
                        <p>A análise das configurações DNS também deve considerar aspectos críticos de segurança. Uma dessas abordagens é a avaliação do uso de <span class="important">DNSSEC</span> (Domain Name System Security Extensions), que visa proteger o processo de resolução de nomes contra ataques, como o envenenamento de cache DNS. Ao validar a autenticidade das respostas DNS, o DNSSEC aumenta a confiança no processo de resolução de nomes e evita que as informações sejam manipuladas.</p>
                        <p>Outro ponto importante é o uso de portas aleatórias no protocolo TCP para grandes consultas DNS, que ajuda a evitar ataques de spoofing e cache poisoning. Além disso, a análise do suporte a protocolos modernos como <span class="important">DoH</span> (DNS over HTTPS) e <span class="important">DoT</span> (DNS over TLS) pode contribuir para uma camada extra de segurança, pois esses protocolos criptografam a comunicação DNS, dificultando a interceptação ou modificação das resoluções DNS.</p>

                        <h3>Blacklists e Segurança de Resolução DNS</h3>
                        <p>Por fim, é fundamental realizar uma verificação do status do servidor DNS utilizado, garantindo que ele não esteja listado em blacklists de DNS, o que pode indicar atividades maliciosas ou comprometimento. A presença do servidor em uma blacklist pode afetar a confiabilidade da rede e a segurança das resoluções de nomes, além de prejudicar a reputação da organização.</p>

                        <h3>Conclusão</h3>
                        <p>A análise rigorosa dos arquivos de zona do DNS e das respostas de resolução de nomes é uma parte essencial do gerenciamento da configuração de TI e da segurança da informação. Validar a conformidade dos IPs, testar a conectividade, verificar as respostas HTTP/HTTPS, e assegurar que as práticas de segurança, como DNSSEC, DoH e DoT, estão sendo adotadas corretamente, são passos cruciais para proteger a infraestrutura de TI contra falhas e ataques. O monitoramento contínuo e a avaliação do DNS utilizado garantem a integridade das operações e a segurança da rede.</p>
                    </main>

                    <footer>
                        <p>&copy; 2025 Segurança da Informação e TI - Todos os direitos reservados</p>
                    </footer>
                </div>
            </Card>
            <br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
        </div>
    );
}
