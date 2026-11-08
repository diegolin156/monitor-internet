# Network Monitor — Continuous

Versión enfocada en **rapidez y continuidad**.

## Ciclo por defecto: Streaming

- Latencia: cada 1 s.
- Jitter: recalculado con cada latencia.
- Pérdida de sonda: cada 1 s.
- Download: microprueba cada 5 s.
- Upload: microprueba cada 8 s.
- Historial: 60 s.
- Actualización de interfaz: inmediata.

Los tests de ancho de banda son deliberadamente pequeños. El objetivo es detectar degradaciones/cortes mientras existe una transmisión, no saturar la conexión con un speed test permanente.

## Publicar en GitHub Pages

Subir `index.html`, `assets/`, `manifest.webmanifest` y `README.md` a un repositorio. Luego:
Settings → Pages → Deploy from branch → `main` → `/root`.

## Limitación técnica

Al ser una web estática, las sondas son HTTP. El navegador no puede hacer ping ICMP real ni leer directamente los paquetes de OBS. Por eso la pérdida se denomina pérdida de sonda HTTP.

Si se necesita diagnóstico de red de nivel profesional, el siguiente paso es un pequeño agente local que mida la interfaz de red y se comunique con esta interfaz web.
