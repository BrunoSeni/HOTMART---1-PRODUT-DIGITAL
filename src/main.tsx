import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Portao } from './Portao';
import './estilos.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Portao />
  </StrictMode>,
);
