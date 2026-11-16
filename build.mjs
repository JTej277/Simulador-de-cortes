// Genera index.html (página autocontenida para abrir directo en el navegador) a partir de src/simulador.html
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('./src/simulador.html', import.meta.url), 'utf8');
writeFileSync(new URL('./index.html', import.meta.url),
  `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n${src}\n</body>\n</html>\n`);
console.log('index.html generado');
