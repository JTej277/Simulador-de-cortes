# Simulador de Cortes

Optimizador de cortes (cutting stock 1D) para perfiles de acero y varillas en barras de 6 m o 12 m, pensado para usar en el taller desde el celular.

## Cómo acceder

- **Página web:** https://jtej277.github.io/Simulador-de-cortes/ . No hace falta cuenta ni instalar nada; cada dispositivo guarda sus propios datos.
- **Sin conexión:** descargá `index.html` y abrilo en el navegador.

## Archivos

- `index.html`: la aplicación completa en un solo archivo. Se abre directo en el navegador, sin instalar nada.
- `src/simulador.html`: fuente de la página (es lo que se publica como artifact).
- `build.mjs`: genera `index.html` a partir de la fuente (`node build.mjs`).
- `test/algoritmo.test.mjs`: pruebas del motor de optimización (`node test/algoritmo.test.mjs`).

## Cómo optimiza

1. **Sin planificar**: corta en el orden de la lista y abre una barra nueva cuando la pieza no entra. Es la referencia para medir el ahorro.
2. **Simple (FFD)**: ordena las piezas de mayor a menor y pone cada una en la primera barra donde entra.
3. **Optimizado**: parte del mejor entre FFD, BFD y un llenado barra por barra con suma de subconjuntos; si el problema es chico (hasta 40 piezas) busca el mínimo de barras con branch and bound; después mejora con búsqueda local (desarma algunas barras y las vuelve a llenar).

Criterio, en orden: menos barras nuevas, menos scrap, sobrantes concentrados en pocos retazos grandes.

Cada pieza ocupa su largo más un espesor de disco; la cuenta de cada barra cierra: largo = despunte + piezas + viruta + sobrante.
