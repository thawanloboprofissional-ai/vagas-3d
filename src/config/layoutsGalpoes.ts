export type CelulaLayout =
  | { tipo: 'vaga'; codigo: string }
  | { tipo: 'bloqueio'; label: string }
  | { tipo: 'vazio' };

export interface LinhaLayout {
  rua: string;
  esquerda: CelulaLayout[];
  direita: CelulaLayout[];
  gapAntes?: string;
}

function vaga(rua: string, coluna: number): CelulaLayout {
  return { tipo: 'vaga', codigo: `${rua}${coluna}` };
}
function bloqueio(label: string): CelulaLayout {
  return { tipo: 'bloqueio', label };
}
function vazio(): CelulaLayout {
  return { tipo: 'vazio' };
}

// ============ GALPÃO A ============
const ruasA = ['R','Q','P','O','N','M','L','J','I','H','G','F','E','D','C','B'];
const ruasA_comImpares = new Set(['R','Q','P','O','N','J','I','H','G']);

export const layoutGalpaoA: LinhaLayout[] = ruasA.map((rua) => ({
  rua,
  esquerda: ruasA_comImpares.has(rua)
    ? [3, 1].map((c) => vaga(rua, c))
    : rua === 'M'
    ? [bloqueio('ENTRADA'), vazio()]
    : [vazio(), vazio()],
  direita: [4, 6, 8, 10].map((c) => vaga(rua, c)),
}));

// ============ GALPÃO B ============
const ruasB = ['Q','P','O','N','M','L','J','I','H','G','F','E','D','C','B','A'];

export const layoutGalpaoB: LinhaLayout[] = ruasB.map((rua) => ({
  rua,
  esquerda: rua === 'I'
    ? [bloqueio('EXTINTOR'), vazio(), vazio(), vazio(), vazio()]
    : [9, 7, 5, 3, 1].map((c) => vaga(rua, c)),
  direita: [2, 4, 6, 8, 10, 12].map((c) => vaga(rua, c)),
}));

// ============ GALPÃO D ============
// Layout fiel ao JSON oficial
// Esquerda = pares [4, 2] (de fora pra dentro do corredor)
// Direita  = ímpares [1, 3, 5] (do corredor pra fora)
// AA e S: posições pares são BRIGADA
// AJ e AL: ímpares só têm coluna 5

const ruasD_topo = [
  'AL','AJ','AI','AH','AG','AF','AE','AD',
  'AC','AB','AA','Z','X','V','U','T','S',
  'R','Q','P','O','N','M','L',
];
const ruasD_baixo = ['A','B','C','D','E','F','G','H','I','J'];

const brigadaD = new Set(['AA','S']);
const apenasCol5D = new Set(['AJ','AL']);

function linhaD(rua: string, gapAntes?: string): LinhaLayout {
  // ESQUERDA: pares [4, 2]
  let esquerda: CelulaLayout[];
  if (brigadaD.has(rua)) {
    esquerda = [bloqueio('BRIGADA'), bloqueio('BRIGADA')];
  } else {
    esquerda = [vaga(rua, 4), vaga(rua, 2)];
  }

  // DIREITA: ímpares [1, 3, 5]
  let direita: CelulaLayout[];
  if (apenasCol5D.has(rua)) {
    // AJ e AL: só coluna 5, as outras são vazias
    direita = [vazio(), vazio(), vaga(rua, 5)];
  } else {
    direita = [vaga(rua, 1), vaga(rua, 3), vaga(rua, 5)];
  }

  return { rua, esquerda, direita, gapAntes };
}

export const layoutGalpaoD: LinhaLayout[] = [
  ...ruasD_topo.map((rua) => linhaD(rua)),
  ...ruasD_baixo.map((rua, i) => linhaD(rua, i === 0 ? 'ENTRADA' : undefined)),
];

// ============ MG3 1° PISO ============
export interface BlocoRua {
  rua: string;
  linhas: string[][];
}

export interface LayoutBlocos {
  grupoEsquerdo: string[];
  grupoDireito: string[];
  blocos: Record<string, BlocoRua>;
}

function blocoABC(rua: string): BlocoRua {
  return {
    rua,
    linhas: [
      [`${rua}9`, `${rua}8`, `${rua}7`],
      [`${rua}6`, `${rua}5`, `${rua}4`],
      [`${rua}3`, `${rua}2`, `${rua}1`],
    ],
  };
}

function blocoDaN(rua: string): BlocoRua {
  return {
    rua,
    linhas: [
      [`${rua}7`, `${rua}8`, `${rua}9`],
      [`${rua}4`, `${rua}5`, `${rua}6`],
      [`${rua}1`, `${rua}2`, `${rua}3`],
    ],
  };
}

const gruposDireitaMG3 = ['D','E','F','G','H','I','J','K','L','M','N'];

export const layoutMG3_1Piso: LayoutBlocos = {
  grupoEsquerdo: ['C','B','A'],
  grupoDireito: gruposDireitaMG3,
  blocos: {
    A: blocoABC('A'),
    B: blocoABC('B'),
    C: blocoABC('C'),
    ...Object.fromEntries(gruposDireitaMG3.map((rua) => [rua, blocoDaN(rua)])),
  },
};