'use client'; // Indica que este código deve ser executado no cliente (React Server Components em Next.js)

import { useState, useEffect } from 'react'; // Importa os hooks useState e useEffect do React
import './page.module.css';  // Importa o arquivo CSS para estilização da página
import * as XLSX from 'xlsx';  // Importa a biblioteca para manipulação de arquivos Excel

export default function HomePage() {
  // Declaração de estados para armazenar os valores do formulário
  const [url, setUrl] = useState(''); // Estado para armazenar a URL
  const [ip, setIp] = useState(''); // Estado para armazenar o IP

  // Estado para armazenar a lista de entradas recebidas do backend
  const [entries, setEntries] = useState([]);

  // Estado para controlar o filtro aplicado às entradas exibidas
  const [filter, setFilter] = useState('todos'); // Opções: 'todos', 'correspondente', 'nao-correspondente'

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o comportamento padrão de recarregar a página

    if (!url || !ip) { // Valida se os campos obrigatórios foram preenchidos
      alert("URL e IP são obrigatórios");
      return;
    }

    try {
      const res = await fetch('/api/entries', { // Faz uma requisição POST para salvar a entrada
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ip }), // Envia os dados em formato JSON
      });

      if (res.ok) { // Se a requisição for bem-sucedida, exibe um alerta e atualiza a lista
        alert("Entrada salva com sucesso!");
        setUrl(''); // Reseta o campo URL
        setIp(''); // Reseta o campo IP
        fetchEntries(); // Recarrega a lista de entradas
      } else {
        alert("Erro ao salvar a entrada.");
      }
    } catch (error) {
      console.error("Erro ao enviar os dados:", error);
      alert("Erro ao salvar a entrada.");
    }
  };

  // Função para buscar as entradas do backend
  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/entries'); // Faz uma requisição GET para obter os dados
      if (res.ok) {
        const data = await res.json(); // Converte a resposta para JSON
        setEntries(data); // Atualiza o estado das entradas
      } else {
        alert("Erro ao carregar as entradas.");
      }
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
      alert("Erro ao carregar as entradas.");
    }
  };

  // Função para filtrar as entradas com base no estado 'filter'
  const filteredEntries = entries.filter(entry => {
    if (filter === 'todos') return true;
    if (filter === 'correspondente') return entry.match === true;
    if (filter === 'nao-correspondente') return entry.match === false;
    return true;
  });

  // Função para exportar as entradas filtradas para um arquivo Excel
  const exportToExcel = () => {
    const formattedEntries = filteredEntries.map(entry => ({
      URL: entry.url,
      'IP Esperado': entry.expectedIp,
      'IP Resolvido': entry.resolvedIp,
      'Status': entry.match !== undefined ? (entry.match ? 'IP Correspondente' : 'IP Não Correspondente') : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(formattedEntries); // Converte os dados para uma planilha
    const wb = XLSX.utils.book_new(); // Cria um novo livro do Excel
    XLSX.utils.book_append_sheet(wb, ws, 'Entradas'); // Adiciona a planilha ao livro
    
    XLSX.writeFile(wb, 'entradas.xlsx'); // Gera e baixa o arquivo Excel
  };

  // useEffect para carregar as entradas assim que o componente for montado
  useEffect(() => {
    fetchEntries(); // Chama a função para buscar as entradas do backend
  }, []);

  return (
    <div className="container">
      <h1>Gerenciamento de URLs</h1>
      
      {/* Formulário para inserir novas entradas */}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>URL:</label>
          <input
            className="input-field"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label>IP:</label>
          <input
            className="input-field"
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-btn">Salvar Entrada</button>
      </form>

      <h2>Entradas Salvas:</h2>
      
      {/* Seletor de filtro */}
      <div className="filter-container">
        <label>Filtrar por:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="todos">Todos</option>
          <option value="correspondente">IP Correspondente</option>
          <option value="nao-correspondente">IP Não Correspondente</option>
        </select>
      </div>

      {/* Lista de entradas */}
      <ul className="entries-list">
        {filteredEntries.length === 0 ? (
          <li className="empty-message">Não há entradas.</li>
        ) : (
          filteredEntries.map((entry, index) => (
            <li key={index} className="entry-item">
              <strong>URL:</strong> {entry.url} | 
              <strong> IP Esperado:</strong> {entry.expectedIp} | 
              <strong> IP Resolvido:</strong> {entry.resolvedIp} 
              {entry.match !== undefined && (
                <span className={entry.match ? "match" : "no-match"}>
                  {entry.match ? " | IP Correspondente" : " | IP Não Correspondente"}
                </span>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Botão para exportar para Excel */}
      <div className="export-container">
        <button onClick={exportToExcel} className="export-btn">Exportar para Excel</button>
      </div>
    </div>
  );
}