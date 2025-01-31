'use client'; // Indica que este código deve ser executado no lado do cliente, não no servidor

import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Menubar } from 'primereact/menubar';
import { Tooltip } from 'primereact/tooltip';
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
            <Card title="Análise de DNS" className="p-mt-4 card-transparent">
                <Tooltip target=".badge-dnssec" content="DNSSEC: Extensão de segurança para DNS" />
                <Badge id="dnssec-badge" className="badge-dnssec p-badge-light" value="DNSSEC" />            

                <Tooltip target=".badge-assinatura" content="Assinatura: Garante a autenticidade das respostas DNS" />
                <Badge className="badge-assinatura p-badge-success" value="Assinatura DNSSEC" /> <span />

                <Tooltip target=".badge-porta" content="Usa Porta Random: Porta de comunicação aleatória" />
                <Badge className="badge-porta p-badge-danger" value="Usa Porta Random" /> <span />

                <Tooltip target=".badge-tcp" content="TCP: Utilizado para consultas DNS de grande porte" />
                <Badge className="badge-tcp p-badge-success" value="TCP para grandes consultas" /> <span />

                <Tooltip target=".badge-doh" content="DoH: DNS sobre HTTPS" />
                <Badge className="badge-doh p-badge-success" value="Suporta DoH" /> <span />

                <Tooltip target=".badge-dot" content="DoT: DNS sobre TLS" />
                <Badge className="badge-dot p-badge-success" value="Suporte DoT" /> <span />

                <Tooltip target=".badge-blacklist" content="Black List: Está na lista negra" />
                <Badge className="badge-blacklist p-badge-success" value="Está em Black List" /> <span />
            </Card>
            <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>

        </div>
    );
}
