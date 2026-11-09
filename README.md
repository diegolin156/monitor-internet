# Network Monitor — medición adaptativa continua

Aplicación estática para GitHub Pages orientada a monitorear una conexión mientras se usa para streaming.

## Qué cambió

- Download y upload son las primeras métricas visibles.
- La medición comienza automáticamente al abrir la página.
- Download y upload **nunca se ejecutan simultáneamente**: se alternan mediante una cola serializada.
- Las sondas normales son pequeñas para mantener baja la carga.
- Si una medición cae respecto de las muestras recientes, se ejecuta automáticamente una **prueba de confirmación más grande**.
- Se evita declarar una degradación por una sola muestra anómala.
- El monitor calcula p50/p95, jitter, pérdida HTTP, margen para OBS y estabilidad.
- El gráfico muestra exclusivamente throughput: Download y Upload.

## Rigurosidad

Esto es una medición activa HTTP desde el navegador, no una medición de capa de red del sistema operativo. Sirve para detectar degradaciones reales de la conectividad disponible para el navegador y para streaming, pero no reemplaza una herramienta local con ICMP/UDP o un agente de red.

La medición adaptativa mejora la confiabilidad sin convertir el monitor en un speedtest pesado permanente. Aun así, toda medición de throughput activa consume ancho de banda.

## GitHub Pages

1. Subí esta carpeta a un repositorio.
2. Settings → Pages.
3. Deploy from branch.
4. Branch: `main`.
5. Folder: `/ (root)`.
6. Guardá y abrí la URL publicada.
