'use client';

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
import { Toast } from 'primereact/toast';
import { ProgressBar } from 'primereact/progressbar';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './globals.css';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [ip, setIp] = useState('');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado de carregamento
  const [progress, setProgress] = useState(0);
  const [zoneFile, setZoneFile] = useState(null);
  const toast = useRef(null);

  const filterOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'IP Correspondente', value: 'correspondente' },
    { label: 'IP Não Correspondente', value: 'nao-correspondente' },
    { label: 'IP Não Resolvido', value: 'nao-resolvido' }
  ];

  const fetchEntries = async () => {
    try {
      setUpdateMessage('Carregando...');
      const res = await fetch('/api/entries');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        setUpdateMessage('Lista de entradas atualizada com sucesso!');
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        alert('Erro ao carregar as entradas.');
      }
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      alert('Erro ao carregar as entradas.');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

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
        setUrl('');
        setIp('');
        fetchEntries();
      } else {
        alert('Erro ao salvar a entrada.');
      }
    } catch (error) {
      console.error('Erro ao enviar os dados:', error);
      alert('Erro ao salvar a entrada.');
    }
  };

  const extractBaseDomain = (lines) => {
    for (const line of lines) {
      // Encontrar a linha que contém o SOA e capturar o domínio
      const soaMatch = line.match(/\S+\s+IN\s+SOA\s+\S+\s+(\S+)/);
      if (soaMatch) {
        const soaDomain = soaMatch[1];

        // Dividir o domínio em partes pelo ponto (.)
        const parts = soaDomain.split('.');

        // Retornar do segundo até o último segmento do domínio, sem o ponto final
        const domainWithoutTrailingDot = parts.slice(1).join('.').replace(/\.$/, '');  // Remove o ponto final, se houver

        return domainWithoutTrailingDot;
      }
    }
    return ''; // Caso nenhum SOA seja encontrado, retorna uma string vazia
  };



  const handleZoneFileUpload = (e) => {
    const file = e.target.files[0];
    setZoneFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const lines = content.split('\n');
      const totalLines = lines.length;
      setProgress(0); // Inicializa o progresso antes de começar

      const baseDomain = extractBaseDomain(lines);

      for (let i = 0; i < totalLines; i++) {
        const line = lines[i];
        const regex = /^(\S+)\s+IN\s+A\s+(\S+)/;
        const match = line.match(regex);

        if (match && baseDomain) {
          const url = `${match[1]}.${baseDomain}`;
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
        setProgress(Math.round(((i + 1) / totalLines) * 100)); // Atualiza a barra de progresso
      }

      alert('Entradas de zona DNS carregadas com sucesso!');
      fetchEntries();
      setProgress(0); // Reseta o progresso após o upload
    };

    reader.readAsText(file);
  };


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
    XLSX.writeFile(wb, 'entradas.xlsx');
  };

  const statusTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.resolvedIp) {
      status = 'IP Não Resolvido';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.match ? 'IP Correspondente' : 'IP Não Correspondente';
      statusClass = rowData.match ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
  };

  // Função para filtrar as entradas
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
        const res = await fetch('/api/entries', {
          method: 'DELETE',
        });
        if (res.ok) {
          setEntries([]);
          alert('Todas as entradas foram excluídas com sucesso.');
        } else {
          alert('Erro ao excluir as entradas.');
        }
      } catch (error) {
        console.error('Erro ao excluir as entradas:', error);
        alert('Erro ao excluir as entradas.');
      }
    }
  };

  return (
    <div className="app-container">
      <Menubar model={[{ label: 'Verifica resolução DNS', icon: 'pi pi-home' }, { label: 'Sobre', icon: 'pi pi-info-circle' }]} className="menu-bar" />
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
            <Button label="Salvar Entrada" icon="pi pi-save" type="submit" className="p-mt-2" />
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
          Pesquisar: <InputText value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar" /> <span></span>
          <Button label="Atualizar Lista" icon="pi pi-refresh" className="update-btn p-mt-3" onClick={fetchEntries} />
          <span> </span>
          <Button label="Exportar para Excel" icon="pi pi-file-excel" className="p-mt-" onClick={exportToExcel} />
          <span> </span>
          <Button label="Excluir Todas as Entradas" icon="pi pi-trash" className="p-mt-2 p-button-danger" onClick={deleteAllEntries} />
          {isLoading ? ( <span>Carregando...</span> ) : ( <span>{updateMessage}</span> )}
          <br /><br />

          {/* Exibir a barra de progresso se o valor de progresso for maior que 0 */}
          {progress > 0 && (
            <div className="p-d-flex p-jc-center p-ai-center p-mt-2">
              <ProgressBar value={progress} showValue={true} />
            </div>
          )}

          <DataTable value={filteredEntries} paginator rows={3} className="p-mt-2">
            <Column field="url" header="URL" sortable></Column>
            <Column field="expectedIp" header="IP Esperado" sortable></Column>
            <Column field="resolvedIp" header="IP Resolvido" sortable></Column>
            <Column field="match" header="Status" body={statusTemplate} sortable></Column>
            <Column field="httpStatus" header="HTTP" sortable></Column>
            <Column field="pingExpectedIp" header="Ping IP esperado" sortable></Column>
            <Column field="pingResolvedIp" header="Ping IP resolvido" sortable></Column>
          </DataTable>

        </Card>
      </div>
    </div>
  );
}
