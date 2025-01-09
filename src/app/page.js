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
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';


export default function HomePage() {
  const [url, setUrl] = useState('');
  const [ip, setIp] = useState('');
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filterOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'IP Correspondente', value: 'correspondente' },
    { label: 'IP Não Correspondente', value: 'nao-correspondente' }
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
        fetchEntries(); // Chama fetchEntries após salvar
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
        setEntries(data); // Atualiza o estado das entradas
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
      'Status': entry.match !== undefined ? (entry.match ? 'IP Correspondente' : 'IP Não Correspondente') : 'N/A',
    }));
    const ws = XLSX.utils.json_to_sheet(formattedEntries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas');
    XLSX.writeFile(wb, 'entradas.xlsx');
  };

  const statusTemplate = (rowData) => {
    const status = rowData.match ? 'IP Correspondente' : 'IP Não Correspondente';
    const statusClass = rowData.match ? 'p-badge-success' : 'p-badge-danger';

    return <Badge value={status} className={statusClass} />;
  };

  const menuItems = [
    { label: 'Verifica resolução DNS', icon: 'pi pi-home' },
    { label: 'Sobre', icon: 'pi pi-info-circle' },
  ];

  return (
    <div className="app-container">
      {/* Barra de navegação */}
      <Menubar model={menuItems} className="menu-bar" />
      <br/>
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
        </Card>

        <p />
        <Card title="Entradas Salvas" className="p-mt-4 card-transparent">
          <div className="p-field">
            <label>Filtrar por:</label>
            <Dropdown value={filter} options={filterOptions} onChange={(e) => setFilter(e.value)} placeholder="Selecione um filtro" />

            <label> Pesquisar:</label>
            <InputText 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Digite para pesquisar" 
            />
            <br/><br/>
          </div>
          
          <DataTable value={filteredEntries} paginator rows={10} className="p-mt-2">
            <Column field="url" header="URL" sortable></Column>
            <Column field="expectedIp" header="IP Esperado" sortable></Column>
            <Column field="resolvedIp" header="IP Resolvido" sortable></Column>
            <Column field="match" header="Status" body={statusTemplate}></Column>
          </DataTable>
        </Card>

        <p />
        <Button label="Exportar para Excel" icon="pi pi-file-excel" className="p-mt-" onClick={exportToExcel} />
      </div>
    </div>
  );
}
