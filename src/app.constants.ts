import monsterData from "./data/data.json";

export type Monster = {
  id: number;
  nome: string;
  level: number;
  hp: number;
  propriedade: string;
  raca: string;
  tamanho: string;
  quantidade_no_mapa: number;
  respawn: string;
  exp_base: number;
  exp_job: number;
  def: number;
  mdef: number;
  mvp?: boolean;
};

export type MapData = {
  mapa: string;
  nome_mapa?: string;
  monstros: Monster[];
};

export const maps = monsterData.mapas as MapData[];
export const MIN_LEVEL_DIFFERENCE = -5;
export const MAX_LEVEL_DIFFERENCE = 15;

export const ELEMENT_NAMES: Record<string, string> = {
  Dark: "Sombrio",
  Earth: "Terra",
  Fire: "Fogo",
  Ghost: "Fantasma",
  Holy: "Sagrado",
  Neutral: "Neutro",
  Poison: "Veneno",
  Shadow: "Sombrio",
  Undead: "Maldito",
  Water: "Água",
  Wind: "Vento",
};

export const ELEMENT_COUNTERS: Record<string, string> = {
  Dark: "Holy",
  Earth: "Fire",
  Fire: "Water",
  Holy: "Shadow",
  Poison: "Holy",
  Shadow: "Holy",
  Undead: "Holy",
  Water: "Wind",
  Wind: "Earth",
};
