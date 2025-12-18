# Empaquetado para Windows (Instalador y Portable)

Esta aplicación puede empaquetarse como una app de escritorio usando Electron y `electron-builder`.

## Comandos rápidos

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Construir el renderer (Vite):

   ```bash
   npm run build
   ```

3. Empaquetar la app:

   - Instalador (NSIS):
     ```bash
     npm run package
     ```

   - Portable (zip/portable):
     ```bash
     npm run dist:portable
     ```

## Notas importantes

- Si intentas generar instaladores `.exe` desde Linux, **necesitarás Wine** para que `electron-builder` pueda firmar/crear ciertos artefactos (NSIS). Por eso recomendamos usar el workflow de GitHub Actions que compila en `windows-latest`.

- Añade un icono de Windows en `build/icon.ico` para personalizar el icono del instalador y la app; de lo contrario se usará el icono por defecto.

- El workflow de ejemplo está en `.github/workflows/build-windows.yml` y compila en Windows y sube los artefactos generados.

## Problemas comunes

- Error: "wine is required" → Instala Wine o usa el runner de GitHub Actions.
- Error: configuración NSIS inválida → Revisa las opciones en `package.json` -> `build.nsis`.

Si quieres, puedo:
- Añadir un icono de ejemplo (ico)
- Ajustar el workflow para crear Releases en GitHub
- Añadir un script CI que suba los artefactos a una Release
