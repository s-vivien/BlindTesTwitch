import { BlindTestTrack, BlindTestTracks } from "components/data/BlindTestData"
import { ClassConstructor, instanceToPlain, plainToInstance } from 'class-transformer'
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
  const codePair: PKCECodePair = await createPKCECodes();
  localStorage.setItem("pkce_pair", JSON.stringify(instanceToPlain(codePair)));
  return codePair;
}

export const consumePkcePair = () => {
  const plain: PKCECodePair = JSON.parse(localStorage.getItem("pkce_pair") || "{}");
  const codePair: PKCECodePair = plainToInstance(PKCECodePair, plain);
  localStorage.removeItem("pkce_pair");
  return codePair;
}

export const getStoredTheme = () => {
  return +(localStorage.getItem("theme") || 0);
}

export const themeNames = ['light', 'dark'];

export const setStoredTheme = (theme: any) => {
  localStorage.setItem("theme", theme)
}

export const getStoredTwitchOAuthToken = () => {
  return localStorage.getItem("twitch_oauth_token");
}

export const setStoredTwitchOAuthToken = (twitch_oauth_token: any) => {
  localStorage.setItem("twitch_oauth_token", twitch_oauth_token)
}

export const deleteStoredTwitchOAuthToken = () => {
  localStorage.removeItem("twitch_oauth_token")
}

export const getStoredRefreshToken = () => {
  return localStorage.getItem("refresh_token")
}

export const setStoredRefreshToken = (refresh_token: any) => {
  localStorage.setItem("refresh_token", refresh_token)
}

export const deleteStoredRefreshToken = () => {
  localStorage.removeItem("refresh_token")
}

export const getStoredUserCountry = () => {
  return localStorage.getItem("user_country")
}

export const setStoredUserCountry = (user_country: any) => {
  localStorage.setItem("user_country", user_country)
}

export const getStoredAccessToken = () => {
  return localStorage.getItem("access_token")
}

export const setStoredAccessToken = (access_token: any) => {
  localStorage.setItem("access_token", access_token)
}

export const deleteStoredAccessToken = () => {
  localStorage.removeItem("access_token")
}

export const hasStoredTracks = () => {
  return localStorage.getItem("blind_test_tracks") !== null
}

export const getStoredSettings = () => {
  const plain: SettingsData = JSON.parse(localStorage.getItem("settings") || "{}");
  return plainToInstance(SettingsData, plain);
}

export const deleteStoredSettings = () => {
  localStorage.removeItem("settings")
}

export const setStoredSettings = (data: SettingsData) => {
  localStorage.setItem("settings", JSON.stringify(instanceToPlain(data)))
}

export const getStoredBlindTestScores = () => {
  const plain: Map<string, number> = JSON.parse(localStorage.getItem("blind_test_scores") || "{}");
  return plainToInstance(Map<string, number>, plain);
}

export const deleteStoredBlindTestScores = () => {
  localStorage.removeItem("blind_test_scores")
}

export const setStoredBlindTestScores = (scores: Map<string, number>) => {
  localStorage.setItem("blind_test_scores", JSON.stringify(instanceToPlain(scores)));
}

export const getStoredBlindTestTracks = () => {
  const plain: BlindTestTracks = JSON.parse(localStorage.getItem("blind_test_tracks") || "{}");
  return plainToInstance(BlindTestTracks, plain);
}

export const deleteStoredBlindTestTracks = () => {
  localStorage.removeItem("blind_test_tracks")
}

export const setStoredBlindTestTracks = (data: BlindTestTracks) => {
  localStorage.setItem("blind_test_tracks", JSON.stringify(instanceToPlain(data)))
}

export const deepCopyObject = <T, V>(cls: ClassConstructor<T>, data: V): T => {
  const stringified = JSON.stringify(instanceToPlain(data));
  const plain: T = JSON.parse(stringified);
  return plainToInstance(cls, plain);
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
    .replaceAll(/[!?]+$/g, "")
    .replaceAll(/^[!?]+/g, "")
    .replaceAll(/ [!?]+/g, " ")
    .replaceAll(/[!?]+ /g, " ")
    .replaceAll(/[¿¡*,.]/g, "")
    .replaceAll("’", "'")
    .replaceAll("œ", "oe")
    .replaceAll(/[$]/g, "s")
    .replaceAll(/[ø]/g, "o")
    .trim();
}

export const cleanSpoiler = (title: string, artists: string[]) => {
  let cleaned = title;
  for (let artist of artists) {
    var escapedArtist = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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