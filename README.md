# Raynu Community Tournament

Este repositorio contiene el sitio estático del **Raynu Community Tournament** junto con un pequeño conjunto de datos de ejemplo que permite navegar el proyecto sin depender de un backend externo.

## API estática de ejemplo

La carpeta [`api/`](api) expone archivos JSON que replican las respuestas esperadas por el frontend:

- [`api/teams.json`](api/teams.json): equipos con su información básica, lema, integrantes y estadísticas.
- [`api/matches.json`](api/matches.json): calendario y llaves del torneo, incluyendo rondas de playoffs.
- [`api/casters.json`](api/casters.json): casters oficiales con enlaces a sus redes sociales.
- [`api/users.json`](api/users.json), [`api/sanctions.json`](api/sanctions.json) y [`api/logs.json`](api/logs.json): colecciones de referencia utilizadas por el panel administrativo.

Estos archivos permiten ejecutar la web de forma local (por ejemplo con `npx http-server`) y visualizar datos reales sin necesidad de desplegar un backend propio.

## Configuración del origen de datos

El archivo [`Js/config.js`](Js/config.js) centraliza la configuración del origen del API. Por defecto intenta conectarse al dominio público `https://api.raynucommunitytournament.xyz/api` y, en caso de fallo, recurre automáticamente a los archivos estáticos del directorio `api/`.

Si cuentas con un backend propio puedes sobrescribir la configuración antes de cargar los scripts principales:

```html
<script>
  window.__RAYNU_CONFIG__ = {
    apiBaseUrl: "https://tu-dominio-personalizado/api",
    serverBaseUrl: "https://tu-dominio-personalizado",
    staticFallbackBaseUrl: "../api" // Opcional, para conservar el modo offline
  };
</script>
<script src="../Js/config.js"></script>
```

Gracias a este archivo también se resuelven automáticamente las rutas de imágenes y logos a través de `resolveMediaUrl`, por lo que el frontend acepta rutas absolutas, relativas o incluso `data:` URIs.

## Cliente JavaScript reutilizable

El script [`Js/raynu-client.js`](Js/raynu-client.js) expone la instancia global
`RaynuClient`, que centraliza el acceso al API, la resolución de medios y los
recursos por defecto del torneo. Los módulos del sitio pueden consumirlo para
obtener funciones listas para usar:

- `RaynuClient.fetchApiData(endpoint)` intenta primero el backend configurado y
  luego el modo offline.
- `RaynuClient.resolveMediaUrl(path)` normaliza logos, fotos y documentos.
- `RaynuClient.withDefault(path, key)` retorna automáticamente imágenes
  placeholder (`teamLogo`, `casterPhoto`, etc.) cuando un registro no posee
  recursos propios.
- `RaynuClient.buildApiUrl(endpoint)` construye URLs completas hacia el backend
  respetando la configuración activa.

Si deseas personalizar los placeholders del proyecto basta con definir
`defaultAssets` antes de cargar `config.js`; la información se fusionará con los
valores por defecto (`teamLogo`, `casterPhoto` y `tournamentLogo`).

## Panel administrativo

El panel (`/Admin`) conserva la lógica original para interactuar con un API REST real, pero mientras se utilicen los datos estáticos mostrará el mensaje de torneo concluido y permanecerá en modo lectura. Cuando el backend esté disponible, basta con ajustar `window.__RAYNU_CONFIG__` para apuntar al dominio correcto y recuperar toda la funcionalidad.

## Desarrollo local rápido

1. Instala un servidor estático simple (por ejemplo `npm install -g http-server`).
2. Ejecuta `http-server .` dentro del repositorio.
3. Abre `http://localhost:8080/Pages/index.html` en tu navegador para navegar el sitio usando los datos de ejemplo.

> **Nota:** En el entorno de pruebas automático de este repositorio no se dispone de acceso a `npm install`, por lo que la solución opta por un dataset estático en lugar de un backend Node.js.
