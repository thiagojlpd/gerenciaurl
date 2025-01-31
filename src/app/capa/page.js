'use client'; // Indica que este código deve ser executado no lado do cliente, não no servidor

import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import SolarSystem from '../solar/page';

import { Menubar } from 'primereact/menubar';
import { useRouter } from 'next/navigation';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '../globals.css';

//import './page.module.css';

// Função principal da página
export default function HomePage() {
    // Definição dos estados para o controle dos dados e interações

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
            <SolarSystem />           
        </div>
    );
}
