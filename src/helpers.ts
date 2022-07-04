import { BlindTestTracks } from "components/data/BlindTestData"
import { deserialize, serialize } from 'class-transformer'
import { createPKCECodes, PKCECodePair } from 'pkce'
import { SettingsData } from "components/data/SettingsData"

export const getAppHomeURL = () => {
  return new URL(window.location.href).origin + process.env.PUBLIC_URL;
}

export const getQueryParam = (name: string) => {
  return getParam(name, window.location.search);
}

export const getHashParam = (name: string) => {
  return getParam(name, window.location.hash);
}

const getParam = (name: string, value: string) => {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"),
    results = regex.exec(value)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

export const computePkcePair = async () => {
  const codePair: PKCECodePair = await createPKCECodes()
  localStorage.setItem("pkce_pair", serialize(codePair))
  return codePair
}

export const consumePkcePair = () => {
  const codePair: PKCECodePair = deserialize(PKCECodePair, localStorage.getItem("pkce_pair") || "{}")
  localStorage.removeItem("pkce_pair")
  return codePair
}

export const getStoredTheme = () => {
  return +(localStorage.getItem("theme") || 0);
}

export const themeNames = ['light', 'dark'];

export const setStoredTheme = (theme: any) => {
  localStorage.setItem("theme", theme)
}

export const getTwitchOAuthToken = () => {
  return localStorage.getItem("twitch_oauth_token");
}

export const setTwitchOAuthToken = (twitch_oauth_token: any) => {
  localStorage.setItem("twitch_oauth_token", twitch_oauth_token)
}

export const removeTwitchOAuthToken = () => {
  localStorage.removeItem("twitch_oauth_token")
}

export const getRefreshToken = () => {
  return localStorage.getItem("refresh_token")
}

export const setRefreshToken = (refresh_token: any) => {
  localStorage.setItem("refresh_token", refresh_token)
}

export const removeRefreshToken = () => {
  localStorage.removeItem("refresh_token")
}

export const getUserCountry = () => {
  return localStorage.getItem("user_country")
}

export const setUserCountry = (user_country: any) => {
  localStorage.setItem("user_country", user_country)
}

export const getAccessToken = () => {
  return localStorage.getItem("access_token")
}

export const setAccessToken = (access_token: any) => {
  localStorage.setItem("access_token", access_token)
}

export const removeAccessToken = () => {
  localStorage.removeItem("access_token")
}

export const hasStoredBlindTest = () => {
  return localStorage.getItem("blind_test_tracks") !== null
}

export const getSettings = () => {
  return deserialize(SettingsData, localStorage.getItem("settings") || "{}")
}

export const removeSettings = () => {
  localStorage.removeItem("settings")
}

export const setSettings = (data: SettingsData) => {
  localStorage.setItem("settings", serialize(data))
}

export const getBlindTestScores = () => {
  // ugly workaround because class-transformer deserialize maps to plain objects ...
  let scores: Map<string, number> = new Map(Object.entries(JSON.parse(localStorage.getItem("blind_test_scores") || "{}")));
  return scores;
}

export const removeBlindTestScores = () => {
  localStorage.removeItem("blind_test_scores")
}

export const setBlindTestScores = (scores: Map<string, number>) => {
  localStorage.setItem("blind_test_scores", serialize(scores));
}

export const getBlindTestTracks = () => {
  let bt = deserialize(BlindTestTracks, localStorage.getItem("blind_test_tracks") || "{}")
  return bt
}

export const removeBlindTestTracks = () => {
  localStorage.removeItem("blind_test_tracks")
}

export const setBlindTestTracks = (data: BlindTestTracks) => {
  localStorage.setItem("blind_test_tracks", serialize(data))
}

// light clean + trailing parts (- X || (X))
export const cleanValue = (value: string) => {
  return cleanValueLight(value)
  .replaceAll(/ \(.+\).*| -.+/g, "")
  .replaceAll(/ & /g, " and ")
  .trim();
}

// lower-case + remove diacritic + remove some special characters
export const cleanValueLight = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .replaceAll(/[!?.]+$/g, "")
    .replaceAll(/^[!?.]+/g, "")
    .replaceAll(/[¿¡*,]/g, "")
    .replaceAll("’", "'")
    .replaceAll("œ", "oe")
    .replaceAll(/[$]/g, "s")
    .replaceAll(/[ø]/g, "o")
    .trim();
}

export const cleanSpoiler = (title: string, artists: string[]) => {
  let cleaned = title;
  for (let artist of artists) {
    var escapedArtist = artist.replace(/(.)/g, '\\$1');
    var regExp = new RegExp(` \\(.*${escapedArtist}.*\\)| \\[.*${escapedArtist}.*\\]| - .*${escapedArtist}.*`, "gi");
    cleaned = cleaned.replaceAll(regExp, "").trim();
  }
  return cleaned;
}

export const getMaxDist = (value: string) => {
  return Math.floor(Math.max(0, value.length - 3) / 6);
}

export const computeDistance = (source: string, target: string) => {
  const sourceLength: number = source.length
  const targetLength: number = target.length
  if (sourceLength === 0) return targetLength
  if (targetLength === 0) return sourceLength

  const dist = new Array<number[]>(sourceLength + 1)
  for (let i = 0; i <= sourceLength; ++i) {
    dist[i] = new Array<number>(targetLength + 1).fill(0)
  }

  for (let i = 0; i < sourceLength + 1; i++) {
    dist[i][0] = i
  }
  for (let j = 0; j < targetLength + 1; j++) {
    dist[0][j] = j
  }
  for (let i = 1; i < sourceLength + 1; i++) {
    for (let j = 1; j < targetLength + 1; j++) {
      let cost = source.charAt(i - 1) === target.charAt(j - 1) ? 0 : 1

      // special cases
      if (source.charAt(i - 1) === ' ' && (target.charAt(j - 1) === '-' || target.charAt(j - 1) === '\'')) cost = 0

      dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost)
      if (i > 1 &&
        j > 1 &&
        source.charAt(i - 1) === target.charAt(j - 2) &&
        source.charAt(i - 2) === target.charAt(j - 1)) {
        dist[i][j] = Math.min(dist[i][j], dist[i - 2][j - 2] + cost)
      }
    }
  }
  return dist[sourceLength][targetLength]
}