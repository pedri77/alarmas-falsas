# ¿Cuántas alarmas son mentira?

Explorable sobre la falacia de la tasa base en detección de intrusiones: un detector que acierta el 99 % y, aun así, unas 9 de cada 10 alarmas son falsas.

Demo: https://pedri77.github.io/alarmas-falsas/

## Qué tiene

1. **Apuesta** antes de ver la respuesta.
2. **Los 10.000 eventos de un día** en una rejilla, y las alarmas del día una a una.
3. **Ataques reales**, **falsos positivos** y **detección**: un control nuevo por sección.
4. **El dilema del umbral**: dos campanas de puntuación de sospecha y un umbral que se arrastra, también a escala real.
5. **Tu SOC**: eventos al día y minutos por alarma → horas perdidas en falsas alarmas.

Cada control guarda su valor en la URL (`?a=30&f=0.5`), así que un estado se puede compartir.

## Modelo y fuentes

`src/modelo.ts`: valor predictivo positivo en frecuencias naturales y teoría de detección de señales (campanas ilustrativas: normales N(30, 10), ataques N(77, 10)). Las cifras del detector son un ejemplo, no las de un producto.

- Axelsson, S. (2000). *The base-rate fallacy and the difficulty of intrusion detection*. ACM TISSEC 3(3). https://doi.org/10.1145/357830.357849
- Gigerenzer, G. y Hoffrage, U. (1995). *How to improve Bayesian reasoning without instruction: Frequency formats*. Psychological Review 102(4). https://doi.org/10.1037/0033-295X.102.4.684

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3027
npm test         # tests del modelo (Node ≥ 22.18)
npm run lint && npm run build
```

React 19, Vite y Tailwind 4, sin librerías de animación. Accesible con teclado y lector de pantalla; respeta `prefers-reduced-motion`. Despliegue a GitHub Pages con `.github/workflows/pages.yml` en cada push a `main`.
