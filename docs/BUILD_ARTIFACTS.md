# Artifacts / Instaladores en el repositorio

A partir de ahora, cuando se ejecute el workflow `build-windows.yml`, los instaladores y artefactos generados se guardarán en la rama `builds` dentro del directorio:

  builds/windows/<tag-or-build-id>/

Ejemplo:

  builds/windows/v0.1.0/VoxClon IA-Setup-0.1.0.exe

Notas:
- Evitamos añadir binarios a `main`; en su lugar se usan ramas `builds` para no inflar la rama principal.
- Si prefieres otra ubicación o esquema de nombres, dime y lo adapto.
- Si necesitas que los artefactos también estén en una carpeta del repo en `main`, puedo crear un PR que mueva una prueba de artefactos (solo para releases aprobadas).
