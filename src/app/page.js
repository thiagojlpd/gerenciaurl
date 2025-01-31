'use client'; // Indica que este código deve ser executado no lado do cliente, não no servidor

import { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Menubar } from 'primereact/menubar';
import * as XLSX from 'xlsx';
import { ProgressBar } from 'primereact/progressbar';
import { useRouter } from 'next/navigation';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './globals.css';

// Função principal da página
export default function HomePage() {
  // Definição dos estados para o controle dos dados e interações
  const [url, setUrl] = useState('');
  const [ip, setIp] = useState('');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [progress, setProgress] = useState(0); // Estado para controle de progresso
  const [zoneFile, setZoneFile] = useState(null); // Estado para armazenar o arquivo de zona DNS
  const toast = useRef(null); // Referência para exibir notificações
  const router = useRouter();


  const [urlAnaliseDNS, setUrlAnaliseDNS] = useState('');

  // Definição das opções de filtro para as entradas
  const filterOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'IP Correspondente', value: 'correspondente' },
    { label: 'IP Não Correspondente', value: 'nao-correspondente' },
    { label: 'IP Não Resolvido', value: 'nao-resolvido' }
  ];

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
  
  // Função para buscar as entradas do servidor
  const fetchEntries = async () => {
    try {
      setUpdateMessage('Carregando...'); // Exibe mensagem de carregamento
      const res = await fetch('/api/entries'); // Requisição para buscar as entradas
      if (res.ok) {
        const data = await res.json();
        setEntries(data); // Atualiza o estado com as entradas recebidas
        setUpdateMessage('Lista de entradas atualizada com sucesso!');
        setTimeout(() => setUpdateMessage(''), 3000); // Limita a duração da mensagem
      } else {
        alert('Erro ao carregar as entradas.');
      }
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      alert('Erro ao carregar as entradas.');
    }
  };

  // Executa a busca ao carregar o componente
  useEffect(() => {
    fetchEntries();
  }, []);

  // Função para enviar uma nova entrada (URL e IP) ao servidor
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !ip) {
      alert('URL e IP são obrigatórios');
      return;
    }
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ip }),
      });
      if (res.ok) {
        alert('Entrada salva com sucesso!');
        setUrl(''); // Limpa o campo de URL
        setIp(''); // Limpa o campo de IP
        fetchEntries(); // Recarrega a lista de entradas
      } else {
        alert('Erro ao salvar a entrada.');
      }
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
      alert('Erro ao salvar a entrada.');
    }
  };




  // Função para extrair o domínio base de um arquivo de zona DNS
  const extractBaseDomain = (lines) => {
    for (const line of lines) {
      const soaMatch = line.match(/\S+\s+IN\s+SOA\s+\S+\s+(\S+)/);
      if (soaMatch) {
        const soaDomain = soaMatch[1];
        const parts = soaDomain.split('.'); // Divide o domínio por pontos
        const domainWithoutTrailingDot = parts.slice(1).join('.').replace(/\.$/, ''); // Retorna o domínio sem o ponto final
        return domainWithoutTrailingDot;
      }
    }
    return ''; // Retorna uma string vazia se não encontrar o domínio
  };

  // Função para fazer o upload do arquivo de zona DNS e processar as entradas
  const handleZoneFileUpload = (e) => {
    const file = e.target.files[0];
    setZoneFile(file); // Atualiza o estado com o arquivo carregado
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const lines = content.split('\n');
      const totalLines = lines.length;
      setProgress(0); // Inicializa o progresso antes de começar a leitura do arquivo
      const baseDomain = extractBaseDomain(lines); // Extrai o domínio base

      for (let i = 0; i < totalLines; i++) {
        const line = lines[i];
        const regex = /^(\S+)\s+IN\s+A\s+(\S+)/;
        const match = line.match(regex); // Encontra as entradas do tipo A (IPv4)

        if (match && baseDomain) {
          const url = `${match[1]}.${baseDomain}`; // Cria a URL a partir da entrada
          const ip = match[2];
          try {
            const res = await fetch('/api/entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, ip }),
            });
            if (res.ok) {
              console.log(`Entrada salva com sucesso para URL: ${url}`);
            } else {
              console.error(`Erro ao salvar a entrada para URL: ${url}`);
            }
          } catch (error) {
            console.error('Erro ao enviar os dados:', error);
          }
        }
        setProgress(Math.round(((i + 1) / totalLines) * 100)); // Atualiza o progresso
      }
      alert('Entradas de zona DNS carregadas com sucesso!');
      fetchEntries(); // Recarrega a lista de entradas
      setProgress(0); // Reseta o progresso após o upload
    };

    reader.readAsText(file); // Lê o conteúdo do arquivo como texto
  };

  // Função para exportar as entradas para um arquivo Excel
  const exportToExcel = () => {
    const formattedEntries = entries.map(entry => ({
      URL: entry.url || 'N/A',
      'IP Esperado': entry.expectedIp || 'N/A',
      'IP Resolvido': entry.resolvedIp || 'N/A',
      'Status': entry.resolvedIp
        ? (entry.match ? 'IP Correspondente' : 'IP Não Correspondente')
        : 'IP Não Resolvido',
      'HTTP': entry.httpStatus || 'N/A',
      'Pingou IP experado': entry.pingExpectedIp || 'N/A',
      'Pingou IP resolvido': entry.pingResolvedIp || 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(formattedEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas');
    XLSX.writeFile(wb, 'entradas.xlsx'); // Cria o arquivo Excel
  };

  // Funções para exibir os status das entradas com diferentes templates
  const statusTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.resolvedIp) {
      status = 'IP não Resolvido';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.match ? 'IP Correspondentes' : 'IP não Correspondentes';
      statusClass = rowData.match ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  // Função para exibir o status HTTP
  const httpTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.httpStatus) {
      status = 'Sem código';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.httpStatus;
      statusClass = rowData.httpStatus.includes('200') ? (rowData.httpStatus.includes('falhou') ? 'p-badge-light' : 'p-badge-success') : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  // Funções para exibir os status de ping para os IPs
  const pingResolvedIpTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.pingResolvedIp) {
      status = 'IP não Resolvido';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.pingResolvedIp;
      statusClass = rowData.pingResolvedIp == 'Pingou' ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  const pingExpectedIpTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.pingExpectedIp) {
      status = 'Sem IP cadastrado';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.pingExpectedIp;
      statusClass = rowData.pingExpectedIp == 'Pingou' ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  const ipResolvidoTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.resolvedIp) {
      status = 'Sem IP resolvido';
      statusClass = 'p-badge-danger';
    } else {
      status = rowData.resolvedIp;
      statusClass = rowData.resolvedIp == rowData.expectedIp ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  // Função para filtrar as entradas com base nos critérios definidos
  const filteredEntries = entries.filter((entry) => {
    const url = entry.url?.toLowerCase() || '';
    const ip = entry.resolvedIp?.toLowerCase() || ''; // Alterado de `entry.ip` para `entry.resolvedIp`

    const matchesSearchTerm =
      url.includes(searchTerm.toLowerCase()) || ip.includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'todos' ||
      (filter === 'correspondente' && entry.match) ||
      (filter === 'nao-correspondente' && !entry.match) ||
      (filter === 'nao-resolvido' && !entry.resolvedIp);

    return matchesSearchTerm && matchesFilter;
  });

  // Função para excluir todas as entradas
  const deleteAllEntries = async () => {
    const confirmed = window.confirm('Tem certeza de que deseja excluir todas as entradas?');
    if (confirmed) {
      try {
        setUpdateMessage('Deletando...');
        const res = await fetch('/api/entries', {
          method: 'DELETE',
        });
        if (res.ok) {
          setEntries([]); // Limpa todas as entradas da lista
          alert('Todas as entradas foram excluídas com sucesso.');
        } else {
          alert('Erro ao excluir as entradas.');
        }
        setUpdateMessage('Lista de entradas deletada!');
        setTimeout(() => setUpdateMessage(''), 3000); // Limita a duração da mensagem
      } catch (error) {
        console.error('Erro ao excluir as entradas:', error);
        alert('Erro ao excluir as entradas.');
        setUpdateMessage('Lista de entradas não pode ser deletada!');
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    }
  };

  // Renderiza a interface de usuário
  return (
    <div className="app-container">
      <Menubar model={[{ label: 'URL', icon: 'pi pi-sync', command: handleAHomeNavigation }, { label: 'DNS', icon: 'pi pi-share-alt', command: handleADnsNavigation }, { label: 'Sobre', icon: 'pi pi-info-circle', command: handleAboutNavigation }, { label: 'Capa', icon: 'pi pi-info-circle', command: handleCapaNavigation }]} className="menu-bar" />
      <br />
      <div className="p-4">
        <Card title="Gerenciamento de URLs" className="card-transparent">
          <form onSubmit={handleSubmit} className="p-fluid">
            <div className="p-field">
              <label>URL:</label>
              <InputText value={url} onChange={(e) => setUrl(e.target.value)} required />
            </div>
            <div className="p-field">
              <label>IP:</label>
              <InputText value={ip} onChange={(e) => setIp(e.target.value)} required />
            </div>
            <p />
            <Button label="" icon="pi pi-save" type="submit" className="p-mt-2" />
          </form>
          <p></p>
          <input type="file" accept=".txt" onChange={handleZoneFileUpload} style={{ display: 'none' }} id="zone-file-upload" />
          <Button
            label="Upload Zona DNS"
            icon="pi pi-upload"
            className="p-mt-2"
            onClick={() => document.getElementById('zone-file-upload').click()}
          />
        </Card>

        <p />
        <Card title="Entradas Salvas" className="p-mt-4 card-transparent">
          Filtrar por: <Dropdown value={filter} options={filterOptions} onChange={(e) => setFilter(e.value)} placeholder="Selecione um filtro" /> <span></span>
          URL: <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar" /> <span></span>
          <Button label="" icon="pi pi-refresh" className="update-btn p-mt-3" onClick={fetchEntries} />
          <span> </span>
          <Button label="" icon="pi pi-file-excel" className="p-mt-" onClick={exportToExcel} />
          <span> </span>
          <Button label="" icon="pi pi-trash" className="p-mt-2 p-button-danger" onClick={deleteAllEntries} />
          {isLoading ? (<span>Carregando...</span>) : (<span>{updateMessage}</span>)}
          <br /><br />

          {/* Exibir a barra de progresso se o valor de progresso for maior que 0 */}
          {progress > 0 && (
            <div className="p-d-flex p-jc-center p-ai-center p-mt-2">
              <ProgressBar value={progress} showValue={true} />
            </div>
          )}

          <DataTable value={filteredEntries} paginator rows={50} className="p-mt-2">
            <Column field="url" header="URL" sortable />
            <Column field="expectedIp" header="IP Esperado" sortable />
            <Column field="resolvedIp" header="IP Resolvido" body={ipResolvidoTemplate} sortable />

            <Column
              field="nslookup.serverAddress"
              header="DNS usado"
              body={(rowData) => (
                <Badge
                  value={rowData.nslookup?.serverAddress || "Não disponível"} // Garantia de acesso seguro
                  className="p-badge-light" // Corrigido para uma string válida
                />
              )}
              sortable
            />
            {/* <Column field="match" header="Status" body={statusTemplate} sortable /> */}
            <Column field="httpStatus" header="HTTP" body={httpTemplate} sortable />
            <Column field="pingExpectedIp" header="Ping IP esperado" body={pingExpectedIpTemplate} sortable />
            <Column field="pingResolvedIp" header="Ping IP resolvido" body={pingResolvedIpTemplate} sortable />
          </DataTable>

        </Card>
      </div>
    </div>
  );
}
