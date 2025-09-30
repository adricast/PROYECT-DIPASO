import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css';
import App from './App.tsx';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // tema de PrimeReact
import 'primereact/resources/primereact.min.css';               // core de PrimeReact
import 'primeicons/primeicons.css';                             // íconos
import 'primeflex/primeflex.css';                               // (opcional) utilidades PrimeFlex
import './input.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Registrar Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado con éxito:", registration);
      })
      .catch((error) => {
        console.error("Error registrando Service Worker:", error);
      });
  });
}
