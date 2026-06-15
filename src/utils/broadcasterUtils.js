const BROADCASTER_LOGO_MAP = {
  Telefé: "telefe",
  "TyC Sports": "tyc-sports",
  DGO: "dgo",
};

export function getBroadcasterLogoSrc(channel) {
  const fileName = BROADCASTER_LOGO_MAP[channel];

  return fileName
    ? `/broadcasters/${fileName}.png`
    : "/broadcasters/fallback.png";
}

export function handleBroadcasterLogoError(event) {
  event.currentTarget.src = "/broadcasters/fallback.png";
}