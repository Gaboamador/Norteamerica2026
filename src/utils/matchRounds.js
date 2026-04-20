export const ROUND_OPTIONS = [
  { value: 1, label: "Fecha 1", isGroupStage: true },
  { value: 2, label: "Fecha 2", isGroupStage: true },
  { value: 3, label: "Fecha 3", isGroupStage: true },
  { value: 4, label: "Dieciseisavos de final", isGroupStage: false },
  { value: 5, label: "Octavos de final", isGroupStage: false },
  { value: 6, label: "Cuartos de final", isGroupStage: false },
  { value: 7, label: "Semifinal", isGroupStage: false },
  { value: 8, label: "Partido por el tercer puesto", isGroupStage: false },
  { value: 9, label: "Final", isGroupStage: false },
];

export const getRoundLabel = (round) => {
  return ROUND_OPTIONS.find((r) => r.value === Number(round))?.label || `Ronda ${round}`;
};

export const isGroupStageRound = (round) => {
  return Number(round) <= 3;
};