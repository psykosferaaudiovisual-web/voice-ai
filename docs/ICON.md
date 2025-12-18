# Iconos para Windows

Se ha añadido un icono SVG de ejemplo en `build/icon.svg`. Antes de generar los instaladores, el workflow convierte el SVG a `build/icon.ico` usando `svg2ico`.

Si quieres personalizar el icono:
1. Reemplaza `build/icon.svg` por tu SVG (preferiblemente cuadrado y con alta resolución). 
2. El workflow y los scripts de `package.json` generarán `build/icon.ico` automáticamente.

Comandos útiles:
- Generar el .ico localmente: `npm run build:icons` (requiere `svg2ico` instalado o ImageMagick)
- Alternativamente (Windows/CI) el workflow usa ImageMagick:
  `magick convert build/icon.svg -resize 256x256 build/icon.ico`
- Incluir el icono en la build: `npm run package` (se ejecuta `build:icons` antes de empaquetar)
