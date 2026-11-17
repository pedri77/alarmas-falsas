/**
 * Guion (references/guion.md de web-explorable)
 *
 * Idea: si los ataques son raros, la mayoría de las alarmas son falsas aunque el detector acierte el 99 %.
 * Intuición que se rompe: «acierta el 99 %, así que una alarma es casi seguro un ataque».
 * Modelo: valor predictivo positivo = vp / (vp + fa) en frecuencias naturales (src/modelo.ts).
 *
 * | # | Pregunta                         | Control                         | Patrón |
 * | 1 | ¿Qué probabilidad hay…?          | apuesta 0–100                   | 4      |
 * | 2 | ¿Por qué?                        | ninguno (rejilla + bandeja)     | –      |
 * | 3 | ¿Y si hubiera más ataques?       | a: ataques por 10.000 (1–1000)  | 1      |
 * | 4 | ¿Y si se equivocara menos?       | f: falsos positivos (0,01–10 %) | 1      |
 * | 5 | ¿Y si detectara más?             | s: detección (50–100 %)         | 1      |
 * | 6 | El dilema del umbral             | u: umbral 0–100 + v: escala     | 5, 6   |
 * | 7 | Tu SOC                           | e: eventos/día, m: min/alarma   | 9, 10  |
 *
 * Estados QA: "" a=1 a=1000 f=0.01 f=10 s=50 s=100 u=40 u=70 v=real e=1000000&m=30 a=1&s=50&f=0.01
 */
import {Campanas} from './components/Campanas';
import {Deslizador} from './components/Deslizador';
import {Opciones} from './components/Opciones';
import {Panel} from './components/Panel';
import {Prediccion} from './components/Prediccion';
import {contenido as c} from './content';
import {useEscalon} from './hooks/useEscalon';
import {useOpcion, useParametro} from './hooks/useParametro';
import {num} from './lib/math';
import {pct, plural} from './lib/formato';
import {EVENTOS, porUmbral, recuento, recuentoEntero} from './modelo';

const ATAQUES = [1, 2, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000] as const;
const FP = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10] as const;
const EVENTOS_DIA = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000] as const;
const POR_DEFECTO = {ataques: 10, sens: 0.99, fp: 0.01};

function Seccion({id, n, titulo, children}: {id: string; n: number; titulo: string; children: React.ReactNode}) {
  return (
    <section className="mt-20 sm:mt-28" aria-labelledby={id}>
      <p className="text-etiqueta uppercase text-acento">{String(n).padStart(2, '0')}</p>
      <h2 id={id} className="mt-2 font-display text-display text-balance">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const P = ({children}: {children: React.ReactNode}) => <p className="mt-4 text-body text-texto-2 text-pretty max-w-[62ch]">{children}</p>;

const porDiezMil = (v: number) => `${num(v)} de cada 10.000`;

export default function App() {
  const [ataques, iA, fijarA] = useEscalon('a', 10, ATAQUES);
  const [fpPct, iF, fijarF] = useEscalon('f', 1, FP);
  const [sensPct, fijarS] = useParametro('s', 99, 50, 100);
  const [umbral, fijarU] = useParametro('u', 53, 0, 100);
  const [vista, fijarVista] = useOpcion('v', 'igual', ['igual', 'real'] as const);
  const [eventosDia, iE, fijarE] = useEscalon('e', 10_000, EVENTOS_DIA);
  const [minutos, fijarM] = useParametro('m', 5, 1, 30);

  const det3 = {...POR_DEFECTO, ataques};
  const det4 = {...det3, fp: fpPct / 100};
  const det5 = {...det4, sens: sensPct / 100};
  const det6 = {ataques, ...porUmbral(umbral)};
  const r6 = recuento(det6);
  const r6e = recuentoEntero(det6);
  const r7 = recuento(det5, eventosDia);
  const horas = (r7.fa * minutos) / 60;
  const correcta = Math.round(recuentoEntero(POR_DEFECTO).vpp * 100);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <header>
        <p className="text-etiqueta uppercase text-texto-3">Un explorable sobre detección de intrusiones</p>
        <h1 className="mt-4 font-display text-hero text-balance">{c.titulo}</h1>
        <p className="mt-6 text-lead text-texto-2 text-pretty max-w-[52ch]">{c.entradilla}</p>
        <p className="mt-6 text-body text-texto-3 max-w-[62ch]">{c.supuesto}</p>
      </header>

      <Seccion id="s1" n={1} titulo="Apuesta antes de mirar">
        <P>En esta red, 10 de cada 10.000 eventos son ataques. El detector marca el 99 % de los ataques y solo se equivoca con el 1 % de los eventos normales.</P>
        <div className="mt-6">
          <Prediccion
            pregunta="Salta una alarma. ¿Qué probabilidad hay de que sea un ataque real?"
            min={0}
            max={100}
            correcta={correcta}
            formato={(v) => `${v}\u00a0%`}
            revelacion={(a) => (
              <>
                {Math.abs(a - correcta) <= 3
                  ? 'Muy pocos aciertan. '
                  : a > correcta
                    ? `Apostaste ${a} %, ${a - correcta} puntos de más. Es lo que apuesta casi todo el mundo. `
                    : `Apostaste ${a} %: te quedaste corto, que es raro. `}
                Unas 9 de cada 10 alarmas son falsas. Abajo está el porqué.
              </>
            )}
          />
        </div>
      </Seccion>

      <Seccion id="s2" n={2} titulo="Los 10.000 eventos de un día">
        <P>
          Cada punto es un evento. Hay 10 ataques (con halo, para que los encuentres) y 9.990 eventos normales. El 1 % de esos 9.990 son 100 falsas alarmas: muchas más que los 10 ataques que el detector sí encuentra.
        </P>
        <Panel det={POR_DEFECTO} />
      </Seccion>

      <Seccion id="s3" n={3} titulo="¿Y si hubiera más ataques?">
        <P>El detector es el mismo. Solo cambia lo frecuentes que son los ataques en tu red: lo que en estadística se llama tasa base.</P>
        <div className="tarjeta mt-6">
          <Deslizador
            etiqueta="Ataques reales"
            valor={iA}
            min={0}
            max={ATAQUES.length - 1}
            onCambio={fijarA}
            formato={(i) => porDiezMil(ATAQUES[i])}
          />
        </div>
        <Panel det={det3} />
        <P>
          {ataques <= 10
            ? 'Con ataques tan raros, casi todo lo que suena es ruido. Prueba a subir el control.'
            : ataques >= 500
              ? 'Solo cuando los ataques son frecuentes la alarma se vuelve fiable. Una red sana no es así.'
              : 'Cuanto más raros son los ataques, menos vale cada alarma, con el mismo detector.'}
        </P>
      </Seccion>

      <Seccion id="s4" n={4} titulo="¿Y si se equivocara menos?">
        <P>Mantenemos los ataques que has elegido arriba ({porDiezMil(ataques)}). Ahora cambia la tasa de falsos positivos: la fracción de eventos normales que el detector marca por error.</P>
        <div className="tarjeta mt-6">
          <Deslizador etiqueta="Falsos positivos" valor={iF} min={0} max={FP.length - 1} onCambio={fijarF} formato={(i) => `${num(FP[i])}\u00a0%`} />
        </div>
        <Panel det={det4} />
        <P>Es la palanca que más mueve el resultado: cada punto de falsos positivos se multiplica por los miles de eventos normales.</P>
      </Seccion>

      <Seccion id="s5" n={5} titulo="¿Y si detectara más?">
        <P>La otra cifra del detector: qué parte de los ataques reales marca.</P>
        <div className="tarjeta mt-6">
          <Deslizador etiqueta="Ataques detectados" valor={sensPct} min={50} max={100} onCambio={fijarS} formato={(v) => `${v}\u00a0%`} />
        </div>
        <Panel det={det5} />
        <P>Con ataques raros, apenas cambia el porcentaje de alarmas reales. Lo que cambia es cuántos ataques se escapan sin hacer ruido, y eso no sale en ningún panel de alarmas.</P>
      </Seccion>

      <Seccion id="s6" n={6} titulo="El dilema del umbral">
        <P>
          Los detectores no eligen esas dos cifras por separado. Dan a cada evento una puntuación de sospecha y suenan por encima de un umbral. Arrastra el umbral: al bajarlo detecta más ataques, pero también marca más eventos normales.
        </P>
        <div className="tarjeta mt-6">
          <Opciones
            etiqueta="Altura de las campanas"
            valor={vista}
            onCambio={fijarVista}
            opciones={[
              {valor: 'igual', texto: 'Misma altura'},
              {valor: 'real', texto: 'A escala real'},
            ]}
          />
          <Campanas umbral={umbral} onUmbral={fijarU} pesoNormal={vista === 'real' ? EVENTOS - ataques : 1} pesoAtaque={vista === 'real' ? ataques : 1} />
          <div className="mt-4">
            <Deslizador etiqueta="Umbral de sospecha" valor={umbral} min={0} max={100} onCambio={fijarU} formato={(v) => `${v} de 100`} />
          </div>
          {vista === 'real' && (
            <p className="mt-3 text-body text-texto-3">
              A escala real, con {porDiezMil(ataques)}, la campana de los ataques {ataques < 100 ? 'casi no se ve' : 'sigue siendo pequeña'}. Esa diferencia de tamaño es toda la historia.
            </p>
          )}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4" aria-live="polite">
            <div>
              <dt className="text-etiqueta uppercase text-texto-3">Detecta</dt>
              <dd className="font-cifra text-lead tabular-nums">{pct(det6.sens)}</dd>
            </div>
            <div>
              <dt className="text-etiqueta uppercase text-texto-3">Falsos positivos</dt>
              <dd className="font-cifra text-lead tabular-nums">{pct(det6.fp)}</dd>
            </div>
            <div>
              <dt className="text-etiqueta uppercase text-texto-3">Falsas alarmas al día</dt>
              <dd className="font-cifra text-lead tabular-nums text-acento">{num(Math.round(r6.fa))}</dd>
            </div>
            <div>
              <dt className="text-etiqueta uppercase text-texto-3">Alarmas reales</dt>
              <dd className="font-cifra text-lead tabular-nums text-acento-2">{r6e.alarmas > 0 ? pct(r6e.vpp) : 'sin alarmas'}</dd>
            </div>
          </dl>
          <p className="mt-4 text-body text-texto-2">
            {r6.fn >= 0.5
              ? `Y se escapan ${plural(Math.round(r6.fn), 'ataque', 'ataques')} de ${num(ataques)}.`
              : 'No se escapa ningún ataque, a cambio de todas esas falsas alarmas.'}
          </p>
        </div>
        <P>No existe un umbral que lo arregle todo. Bajarlo ahoga al equipo en ruido; subirlo deja pasar ataques. Elegirlo es una decisión de negocio, no solo técnica.</P>
      </Seccion>

      <Seccion id="s7" n={7} titulo="Ahora, tu SOC">
        <P>
          Con el detector que has ajustado en las secciones 3 a 5 ({num(ataques)} ataques por cada 10.000 eventos, {num(fpPct)}&nbsp;% de falsos positivos, {sensPct}&nbsp;% detectado), pon el volumen de tu red y lo que tarda tu equipo en descartar una alarma.
        </P>
        <div className="tarjeta mt-6 grid gap-6">
          <Deslizador etiqueta="Eventos al día" valor={iE} min={0} max={EVENTOS_DIA.length - 1} onCambio={fijarE} formato={(i) => num(EVENTOS_DIA[i])} />
          <Deslizador etiqueta="Minutos por alarma" valor={minutos} min={1} max={30} onCambio={fijarM} formato={(v) => plural(v, 'minuto', 'minutos')} />
          <div className="border-t border-borde pt-6" aria-live="polite">
            <p className="font-cifra text-display tabular-nums text-acento">{num(Math.round(horas * 10) / 10)} h</p>
            <p className="mt-2 text-body text-texto-2">
              al día revisando {plural(Math.round(r7.fa), 'falsa alarma', 'falsas alarmas')}
              {horas >= 4 ? `: equivale a ${num(Math.round((horas / 8) * 10) / 10)} ${Math.round((horas / 8) * 10) === 10 ? 'persona' : 'personas'} a jornada completa (8 h)` : ''}
              . En el mismo día hay {plural(Math.round(r7.vp), 'alarma real', 'alarmas reales')}
              {r7.fn >= 0.5 ? ` y ${plural(Math.round(r7.fn), 'ataque', 'ataques')} sin alarma` : ''}.
            </p>
          </div>
        </div>
      </Seccion>

      <footer className="mt-24 border-t border-borde pt-10">
        <p className="font-display text-lead text-pretty max-w-[48ch]">{c.cierre}</p>
        <div className="tarjeta mt-8">
          <p className="text-body text-texto-2">{c.cta.texto}</p>
          <a className="boton mt-4" href={c.cta.url} rel="noopener">
            {c.cta.boton}
          </a>
        </div>
        <h2 className="mt-10 text-etiqueta uppercase text-texto-3">Fuentes</h2>
        <ul className="mt-3 space-y-2 text-body text-texto-2">
          {c.fuentes.map((f) => (
            <li key={f.url}>
              {f.texto}{' '}
              <a className="underline decoration-borde underline-offset-4 hover:text-texto" href={f.url} rel="noopener">
                {f.url.replace('https://', '')}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-etiqueta uppercase text-texto-3">{c.pie}</p>
      </footer>
    </main>
  );
}
