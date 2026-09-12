import { useMemo, useState } from "react";
import {
  ELEMENT_COUNTERS,
  ELEMENT_NAMES,
  maps,
  MAX_LEVEL_DIFFERENCE,
  MIN_LEVEL_DIFFERENCE,
  type MapData,
  type Monster,
} from "./app.constants";
import "./App.css";

function getMapName(map: MapData) {
  return map.nome_mapa?.trim() || map.mapa;
}

function getElementName(property: string) {
  return property.split(" ")[0];
}

function getElementRecommendation(monsters: Monster[]) {
  const weights = monsters.reduce<Record<string, number>>(
    (accumulator, monster) => {
      const element = getElementName(monster.propriedade);
      accumulator[element] =
        (accumulator[element] || 0) + monster.quantidade_no_mapa;
      return accumulator;
    },
    {}
  );
  const dominantElement =
    Object.entries(weights).sort(
      ([, firstWeight], [, secondWeight]) => secondWeight - firstWeight
    )[0]?.[0] || "Neutral";
  const counterElement = ELEMENT_COUNTERS[dominantElement];

  return {
    target: ELEMENT_NAMES[dominantElement] || dominantElement,
    attack: counterElement ? ELEMENT_NAMES[counterElement] : "Neutro",
    note: counterElement
      ? `melhor contra ${ELEMENT_NAMES[dominantElement] || dominantElement}`
      : "sem fraqueza elemental única",
  };
}

function getPenalty(levelDifference: number) {
  if (levelDifference >= 10) return { multiplier: 1.4, status: "Bônus máximo" };
  if (levelDifference >= 6) {
    return {
      multiplier: 1.15 + (levelDifference - 6) * 0.05,
      status: "Bônus alto",
    };
  }
  if (levelDifference >= -5) return { multiplier: 1, status: "EXP normal" };
  if (levelDifference >= -10) {
    const penalties: Record<number, number> = {
      "-6": 0.95,
      "-7": 0.9,
      "-8": 0.85,
      "-9": 0.8,
      "-10": 0.7,
    };
    return {
      multiplier: penalties[levelDifference],
      status: "Penalidade leve",
    };
  }
  if (levelDifference >= -14) {
    const penalties: Record<number, number> = {
      "-11": 0.6,
      "-12": 0.5,
      "-13": 0.4,
      "-14": 0.35,
    };
    return {
      multiplier: penalties[levelDifference],
      status: "Penalidade moderada",
    };
  }
  return { multiplier: 0.1, status: "Penalidade severa" };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

function App() {
  const [characterLevel, setCharacterLevel] = useState("180");
  const [selectedMap, setSelectedMap] = useState("todos");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const level = Number(characterLevel) || 0;

  const monstersByMap = useMemo(
    () =>
      maps
        .filter(({ mapa }) => selectedMap === "todos" || mapa === selectedMap)
        .map(({ mapa, nome_mapa, monstros }) => ({
          mapa,
          nomeMapa: nome_mapa?.trim() || mapa,
          monstros: monstros
            .map((monster) => {
              const difference = monster.level - level;
              const { multiplier, status } = getPenalty(difference);
              return {
                ...monster,
                difference,
                multiplier,
                status,
                adjustedExp: monster.exp_base * multiplier,
                adjustedJobExp: monster.exp_job * multiplier,
              };
            })
            .filter(
              ({ difference }) =>
                difference >= MIN_LEVEL_DIFFERENCE &&
                difference <= MAX_LEVEL_DIFFERENCE
            )
            .sort((first, second) => second.adjustedExp - first.adjustedExp),
        }))
        .map((map) => ({
          ...map,
          elementRecommendation: getElementRecommendation(map.monstros),
        }))
        .filter(({ monstros }) => monstros.length > 0),
    [level, selectedMap]
  );

  const totalMonsters = monstersByMap.reduce(
    (total, map) => total + map.monstros.length,
    0
  );

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="eyebrow">RAGNAROK / EXP SCOUT</div>
        <h1>Encontre o melhor alvo para o seu nível.</h1>
        <p className="intro">
          Compare a EXP ajustada pela diferença de nível e percorra os mapas com
          mais eficiência.
        </p>
        <section className="controls" aria-label="Filtros da busca">
          <label className="level-control">
            <span>Nível do personagem</span>
            <select
              defaultValue={characterLevel}
              value={characterLevel}
              onChange={(event) => setCharacterLevel(event.target.value)}
            >
              {Array.from({ length: 250 }, (_, index) => index + 1).map(
                (level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                )
              )}
            </select>
            {/* <input
              type="number"
              min="1"
              max="999"
              value={characterLevel}
              onChange={(event) => setCharacterLevel(event.target.value)}
            /> */}
          </label>
          <label className="map-control">
            <span>Mapa</span>
            <select
              value={selectedMap}
              onChange={(event) => setSelectedMap(event.target.value)}
            >
              <option value="todos">Todos os mapas</option>
              {maps.map((map) => (
                <option key={map.mapa} value={map.mapa}>
                  {getMapName(map)}
                </option>
              ))}
            </select>
          </label>
          <div
            className="view-toggle"
            role="group"
            aria-label="Visualização dos monstros"
          >
            <span>Visualização</span>
            <div className="view-toggle-options">
              <button
                type="button"
                className={viewMode === "cards" ? "is-active" : ""}
                aria-pressed={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
              >
                Detalhado
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
              >
                Lista
              </button>
            </div>
          </div>
        </section>
        <div className="summary-row">
          <span>
            <strong>{totalMonsters}</strong> monstros encontrados
          </span>
          <span className="level-readout">Nível {level || "—"}</span>
        </div>
      </header>

      <div className="map-list">
        {monstersByMap.length === 0 ? (
          <div className="empty-state" role="status">
            <strong>Não há informações para sua seleção.</strong>
            <span>Tente outro nível ou escolha outro mapa.</span>
          </div>
        ) : (
          monstersByMap.map(
            ({ mapa, nomeMapa, monstros, elementRecommendation }) => (
              <section className="map-section" key={mapa}>
                <div className="map-heading">
                  <div>
                    <span className="map-code">{mapa}</span>
                    <h2>{nomeMapa}</h2>
                  </div>
                  <div className="map-meta">
                    <div className="element-recommendation">
                      <span>Elemento em destaque</span>
                      <strong>{elementRecommendation.attack}</strong>
                      <small>{elementRecommendation.note}</small>
                    </div>
                    <span className="map-count">{monstros.length} alvos</span>
                  </div>
                </div>
                <div
                  className={`monster-grid ${
                    viewMode === "list" ? "monster-list" : ""
                  }`}
                >
                  {monstros.map((monster) => (
                    <article
                      className="monster-card"
                      key={`${mapa}-${monster.id}`}
                    >
                      <div className="card-topline">
                        <span className="monster-id">#{monster.id}</span>
                        {monster.mvp && <span className="mvp-badge">MVP</span>}
                      </div>
                      <div className="monster-heading">
                        <div>
                          <h3>{monster.nome}</h3>
                          <span className="monster-level">
                            Nível {monster.level}
                          </span>
                        </div>
                        <div className="exp-highlight">
                          <strong>{formatNumber(monster.adjustedExp)}</strong>
                          <span>EXP base ajustada</span>
                        </div>
                      </div>
                      <div className="status-line">
                        <span
                          className={`status status-${
                            monster.status.split(" ")[1]
                          }`}
                        >
                          {monster.status}
                        </span>
                        <span className="difference">
                          {monster.difference > 0 ? "+" : ""}
                          {monster.difference} níveis
                        </span>
                        <span className="multiplier">
                          {Math.round(monster.multiplier * 100)}%
                        </span>
                      </div>
                      {viewMode === "cards" && (
                        <dl className="monster-details">
                          <div>
                            <dt>EXP Job</dt>
                            <dd>{formatNumber(monster.adjustedJobExp)}</dd>
                          </div>
                          <div>
                            <dt>HP</dt>
                            <dd>{formatNumber(monster.hp)}</dd>
                          </div>
                          <div>
                            <dt>Propriedade</dt>
                            <dd>{monster.propriedade}</dd>
                          </div>
                          <div>
                            <dt>Raça</dt>
                            <dd>{monster.raca}</dd>
                          </div>
                          <div>
                            <dt>Tamanho</dt>
                            <dd>{monster.tamanho}</dd>
                          </div>
                          <div>
                            <dt>Quantidade</dt>
                            <dd>{monster.quantidade_no_mapa}</dd>
                          </div>
                          <div>
                            <dt>Respawn</dt>
                            <dd>{monster.respawn}</dd>
                          </div>
                          <div>
                            <dt>DEF / MDEF</dt>
                            <dd>
                              {monster.def} / {monster.mdef}
                            </dd>
                          </div>
                        </dl>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )
          )
        )}
      </div>
    </main>
  );
}

export default App;
