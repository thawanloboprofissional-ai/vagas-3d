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

// ============ GALPÃO D — LAYOUT DEITADO ============
// Cada "coluna" é uma rua. As vagas são exibidas de cima pra baixo.
// Pares ficam acima do corredor, ímpares abaixo.

export interface ColunaDeitada {
  rua: string;
  cima: CelulaLayout[];   // vagas pares (de cima)
  baixo: CelulaLayout[];  // vagas ímpares (de baixo)
}

export interface LayoutDeitado {
  colunas: ColunaDeitada[];
}

const brigadaD = new Set(['AA', 'S']);
const apenasCol5D = new Set(['AL', 'AJ']);

const ruasD_todas = [
  'L','M','N','O','P','Q','R','S','T','U','V','X','Z',
  'AA','AB','AC','AD','AE','AF','AG','AH','AI','AJ','AL',
  'A','B','C','D','E','F','G','H','I','J',
];

export const layoutGalpaoD_deitado: LayoutDeitado = {
  colunas: ruasD_todas.map((rua): ColunaDeitada => {
    if (brigadaD.has(rua)) {
      return {
        rua,
        cima: [bloqueio('BRIGADA'), bloqueio('BRIGADA')],
        baixo: [bloqueio('BRIGADA'), bloqueio('BRIGADA'), bloqueio('BRIGADA')],
      };
    }
    if (apenasCol5D.has(rua)) {
      return {
        rua,
        cima: [vazio(), vazio()],
        baixo: [vazio(), vazio(), vaga(rua, 5)],
      };
    }
    return {
      rua,
      cima: [vaga(rua, 4), vaga(rua, 2)],
      baixo: [vaga(rua, 1), vaga(rua, 3), vaga(rua, 5)],
    };
  }),
};

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