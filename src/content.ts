/**
 * Textos y fuentes. Las cifras del detector son un ejemplo (se dice en la página);
 * lo que tiene fuente es el razonamiento.
 */
export const contenido = {
  titulo: '¿Cuántas alarmas son mentira?',
  entradilla:
    'Un detector de intrusiones acierta el 99 % de las veces. Salta una alarma. Parece claro qué significa. Mueve los números y compruébalo.',
  supuesto:
    'Supuesto de toda la página: una red con 10.000 eventos al día (conexiones, inicios de sesión, ficheros que se abren). Las cifras del detector son un ejemplo, no las de un producto concreto.',
  cierre: 'Una alarma vale lo que vale el detector multiplicado por lo raro que es un ataque. Y los ataques son raros.',
  cta: {
    texto: 'Para saber si lo que hay detrás de una alarma ya es conocido (indicadores, familias de malware, técnicas), consulta MalwareIntel.',
    boton: 'Ir a MalwareIntel',
    url: 'https://malwareintel.es',
  },
  fuentes: [
    {
      texto: 'Axelsson, S. (2000). The base-rate fallacy and the difficulty of intrusion detection. ACM Transactions on Information and System Security, 3(3), 186–205.',
      url: 'https://doi.org/10.1145/357830.357849',
    },
    {
      texto: 'Gigerenzer, G. y Hoffrage, U. (1995). How to improve Bayesian reasoning without instruction: Frequency formats. Psychological Review, 102(4), 684–704.',
      url: 'https://doi.org/10.1037/0033-295X.102.4.684',
    },
  ],
  pie: 'Explorable de David Moya. Las campanas de la sección 6 son ilustrativas: eventos normales centrados en 30, ataques en 77, desviación 10.',
} as const;
