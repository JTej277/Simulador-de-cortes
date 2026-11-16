// Prueba del motor: node test/algoritmo.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync(new URL('../src/simulador.html', import.meta.url), 'utf8');
const code = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const Corte = new Function('module', code + '\nreturn Corte;')({});

function verificar(nombre, o, r) {
  const total = o.piezas.reduce((s, p) => s + p.cant, 0) - r.noEntra.reduce((s, x) => s + x.cant, 0);
  for (const ver of ['sinPlan', 'simple', 'opt']) {
    const { bins, st } = r[ver];
    let n = 0, tomado = 0;
    const cuenta = o.piezas.map(() => 0);
    for (const b of bins) {
      const pz = b.cortes.reduce((s, c) => s + c.l, 0);
      // la cuenta de cada barra cierra
      assert.ok(Math.abs(b.L - (b.desp + pz + b.kerf + b.left)) < 1e-6, `${nombre}/${ver}: barra no cierra`);
      // y es físicamente cortable: piezas + un kerf entre piezas entra en el largo útil
      assert.ok(b.desp + pz + (b.cortes.length - 1) * o.kerf <= b.L + 1e-6, `${nombre}/${ver}: barra pasada de largo`);
      assert.ok(b.kerf >= (b.cortes.length - 1) * o.kerf - 1e-6 && b.kerf <= b.cortes.length * o.kerf + 1e-6, `${nombre}/${ver}: kerf raro`);
      b.cortes.forEach(c => cuenta[c.p]++); n += b.cortes.length; tomado += b.L;
    }
    assert.equal(n, total, `${nombre}/${ver}: faltan o sobran piezas`);
    o.piezas.forEach((p, i) => { if (!r.noEntra.some(x => x.pi === i)) assert.equal(cuenta[i], p.cant); });
    assert.ok(Math.abs(st.tomado - (st.piezas + st.scrap + st.util + st.viruta)) < 1e-6, `${nombre}/${ver}: totales no cierran`);
    assert.ok(Math.abs(tomado - st.tomado) < 1e-6);
    assert.ok(Math.abs(st.aprov - st.piezas / st.tomado) < 1e-9 && Math.abs(st.aprov2 - (1 - (st.scrap + st.viruta) / st.tomado)) < 1e-9);
    assert.ok(bins.filter(b => b.tipo === 'retazo').length <= o.retazos.length);
  }
  assert.ok(r.opt.st.barras <= r.simple.st.barras && r.opt.st.barras <= r.sinPlan.st.barras, `${nombre}: el optimizado no puede ser peor`);
  assert.ok(r.opt.st.barras >= r.lb);
  const f = s => `${s.barras} barras +${s.retUs} ret | aprov ${(s.aprov * 100).toFixed(1)}% | scrap ${s.scrap} | retazo ${s.util} (${s.nUtil}) | viruta ${s.viruta}`;
  console.log(`\n${nombre}  [${r.nItems} piezas, cota ${r.lb}, ${r.probado ? 'óptimo comprobado' : 'no comprobado'}, ${r.ms} ms, ${r.iter} iter]`);
  console.log('  sin planificar:', f(r.sinPlan.st)); console.log('  simple (FFD):  ', f(r.simple.st)); console.log('  optimizado:    ', f(r.opt.st));
}
const run = (nombre, o) => { const r = Corte.resolver(o); verificar(nombre, o, r); return r; };
const base = { kerf: 3, desp: 0, minRet: 300, retazos: [], ms: 250 };

// Caso de ejemplo de la página: reja + portón chico
const diag = Corte.largoReal({ largo: 1900, ang: 45, ext: 2, ref: 'corta' }, 40);
assert.equal(diag, 1980);
assert.equal(Corte.largoReal({ largo: 1800, ang: 45, ext: 2, ref: 'larga' }, 40), 1800);
const tubo = [[1800, 2], [1000, 2], [diag, 1], [2100, 2], [1500, 2], [1000, 2], [900, 1]].map(([len, cant]) => ({ len, cant }));
const plan = [[1420, 4], [920, 3], [250, 2], [120, 6], [60, 8]].map(([len, cant]) => ({ len, cant }));
const alet = [[1040, 14], [1720, 9]].map(([len, cant]) => ({ len, cant }));
run('Tubo 40x40 (con retazo 1450)', { ...base, piezas: tubo, L: 6000, retazos: [1450] });
run('Tubo 40x40 (sin retazos)', { ...base, piezas: tubo, L: 6000 });
run('Planchuela (con 2 retazos de 800)', { ...base, piezas: plan, L: 6000, retazos: [800, 800] });
run('Aletado Ø8 en barras de 12 m', { ...base, piezas: alet, L: 12000 });

// Casos de borde
run('Kerf decimal y despunte', { ...base, kerf: 2.5, desp: 20, piezas: [{ len: 1495, cant: 8 }, { len: 730.5, cant: 5 }], L: 6000 });
const r1 = run('Pieza que no entra', { ...base, piezas: [{ len: 6500, cant: 1 }, { len: 3000, cant: 2 }], L: 6000 });
assert.equal(r1.noEntra.length, 1);
const r2 = run('Piezas justas (2 x 3000 no entran por el kerf)', { ...base, piezas: [{ len: 3000, cant: 2 }], L: 6000 });
assert.equal(r2.opt.st.barras, 2);
const r3 = run('Piezas justas con kerf (2998.5 x 2)', { ...base, piezas: [{ len: 2998.5, cant: 2 }], L: 6000 });
assert.equal(r3.opt.st.barras, 1);

// Carga grande: 260 piezas al azar
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const grande = Array.from({ length: 40 }, () => ({ len: 150 + Math.floor(rnd() * 2600), cant: 1 + Math.floor(rnd() * 12) }));
const rg = run('260 piezas al azar', { ...base, piezas: grande, L: 6000, retazos: [1200, 900, 2500, 700] });
assert.ok(rg.ms < 1500, 'demasiado lento');
console.log('\nTodo OK');
