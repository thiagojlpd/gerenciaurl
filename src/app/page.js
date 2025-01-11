'use client';

import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Menubar } from 'primereact/menubar';
import * as XLSX from 'xlsx';
import { Tooltip } from 'primereact/tooltip';
import { ProgressBar } from 'primereact/progressbar';  // Importando o ProgressBar
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
  const [progress, setProgress] = useState(0); // Valor para controle da progressão
  const [file, setFile] = useState(null);
  const [zoneFile, setZoneFile] = useState(null);

  const filterOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'IP Correspondente', value: 'correspondente' },
    { label: 'IP Não Correspondente', value: 'nao-correspondente' },
    { label: 'IP Não Retornado', value: 'nao-retornado' }
  ];

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

  const fetchEntries = async () => {
    try {
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

  const filteredEntries = entries
    .filter(entry => {
      if (filter === 'todos') return true;
      if (filter === 'correspondente') return entry.match === true;
      if (filter === 'nao-correspondente') return entry.match === false;
      if (filter === 'nao-retornado') return !entry.resolvedIp;
      return true;
    })
    .filter(entry => {
      const entryUrl = entry.url ? entry.url.toLowerCase() : '';
      const expectedIp = entry.expectedIp ? entry.expectedIp.toLowerCase() : '';
      const resolvedIp = entry.resolvedIp ? entry.resolvedIp.toLowerCase() : '';
      return entryUrl.includes(searchTerm.toLowerCase()) || 
             expectedIp.includes(searchTerm.toLowerCase()) || 
             resolvedIp.includes(searchTerm.toLowerCase());
    });

  const exportToExcel = () => {
    const formattedEntries = filteredEntries.map(entry => ({
      URL: entry.url || 'N/A',
      'IP Esperado': entry.expectedIp || 'N/A',
      'IP Resolvido': entry.resolvedIp || 'N/A',
      'Status': entry.resolvedIp
        ? (entry.match ? 'IP Correspondente' : 'IP Não Correspondente')
        : 'IP Não Retornado',
    }));
    const ws = XLSX.utils.json_to_sheet(formattedEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas');
    XLSX.writeFile(wb, 'entradas.xlsx');
  };

  const statusTemplate = (rowData) => {
    let status, statusClass;
    if (!rowData.resolvedIp) {
      status = 'IP Não Retornado';
      statusClass = 'p-badge-warning';
    } else {
      status = rowData.match ? 'IP Correspondente' : 'IP Não Correspondente';
      statusClass = rowData.match ? 'p-badge-success' : 'p-badge-danger';
    }
    return <Badge value={status} className={statusClass} />;
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

      for (let i = 0; i < totalLines; i++) {
        const line = lines[i];
        const regex = /(\S+)\s+IN\s+A\s+(\S+)/;
        const match = line.match(regex);
        if (match) {
          const url = match[1];
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
            <Column field="match" header="Status" body={statusTemplate}></Column>
          </DataTable>
        </Card>
      </div>
    </div>
  );
}
