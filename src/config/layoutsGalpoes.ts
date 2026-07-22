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
const ruasA = ['R', 'Q', 'P', 'O', 'N', 'M', 'L', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B'];
const ruasA_comImpares = new Set(['R', 'Q', 'P', 'O', 'N', 'J', 'I', 'H', 'G']);

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
const ruasB = ['Q', 'P', 'O', 'N', 'M', 'L', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

export const layoutGalpaoB: LinhaLayout[] = ruasB.map((rua) => ({
  rua,
  esquerda: rua === 'I'
    ? [bloqueio('EXTINTOR'), vazio(), vazio(), vazio(), vazio()]
    : [9, 7, 5, 3, 1].map((c) => vaga(rua, c)),
  direita: [2, 4, 6, 8, 10, 12].map((c) => vaga(rua, c)),
}));

// ============ GALPÃO D ============
const ruasD_topo = ['AL', 'AJ', 'AI', 'AH', 'AG', 'AF', 'AE', 'AD', 'AC', 'AB', 'AA', 'Z', 'X', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L'];
const ruasD_baixo = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const brigadaD = new Set(['AA', 'S']);
const apenasCol5D = new Set(['AL', 'AJ']);

function linhaD(rua: string, gapAntes?: string): LinhaLayout {
  const esquerda = brigadaD.has(rua)
    ? [bloqueio('BRIGADA'), bloqueio('BRIGADA')]
    : [4, 2].map((c) => vaga(rua, c));
  const direita = apenasCol5D.has(rua)
    ? [vazio(), vazio(), vaga(rua, 5)]
    : [1, 3, 5].map((c) => vaga(rua, c));
  return { rua, esquerda, direita, gapAntes };
}

export const layoutGalpaoD: LinhaLayout[] = [
  ...ruasD_topo.map((rua) => linhaD(rua)),
  ...ruasD_baixo.map((rua, i) => linhaD(rua, i === 0 ? 'ENTRADA' : undefined)),
];

// ============ MG3 1° PISO (layout em blocos 3x3) ============
export interface BlocoRua {
  rua: string;
  linhas: string[][]; // 3 linhas (topo, meio, base), cada uma com os códigos da esquerda pra direita
}

export interface LayoutBlocos {
  grupoEsquerdo: string[]; // ruas empilhadas verticalmente, topo pra base
  grupoDireito: string[]; // ruas lado a lado, esquerda pra direita
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

const gruposDireitaMG3 = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

export const layoutMG3_1Piso: LayoutBlocos = {
  grupoEsquerdo: ['C', 'B', 'A'],
  grupoDireito: gruposDireitaMG3,
  blocos: {
    A: blocoABC('A'),
    B: blocoABC('B'),
    C: blocoABC('C'),
    ...Object.fromEntries(gruposDireitaMG3.map((rua) => [rua, blocoDaN(rua)])),
  },
};