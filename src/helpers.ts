import { BlindTestTracks } from "components/data/BlindTestData"
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

export const getStoredUserCountry = () => {
  return localStorage.getItem("user_country")
}

export const setStoredUserCountry = (user_country: any) => {
  localStorage.setItem("user_country", user_country)
}

export const getStoredSpotifyRefreshToken = () => {
  return localStorage.getItem("spotify_refresh_token")
}

export const setStoredSpotifyRefreshToken = (refresh_token: any) => {
  localStorage.setItem("spotify_refresh_token", refresh_token)
}

export const deleteStoredSpotifyRefreshToken = () => {
  localStorage.removeItem("spotify_refresh_token")
}

export const getStoredSpotifyAccessToken = () => {
  return localStorage.getItem("spotify_access_token")
}

export const setStoredSpotifyAccessToken = (access_token: any) => {
  localStorage.setItem("spotify_access_token", access_token)
}

export const deleteStoreSpotifyAccessToken = () => {
  localStorage.removeItem("spotify_access_token")
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

// ref, input
export const sorensenDiceScore = (first: string, second: string) => {
  first = first.replace(/\s+/g, '');
  second = second.replace(/\s+/g, '');

  if (first === second) return 1;
  if (first.length < 2 && second.length >= 2) return 0;

  let firstBigrams = new Map();
  let firstReverseBigrams = new Map();
  let firstAltBigrams = new Map();
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first[i] + first[i + 1];
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
    firstBigrams.set(bigram, count);

    const reverseBigram = first[i + 1] + first[i];
    const reverseCount = firstReverseBigrams.has(reverseBigram) ? firstReverseBigrams.get(reverseBigram) + 1 : 1;
    firstReverseBigrams.set(reverseBigram, reverseCount);

    if (i + 2 < first.length) {
      const altBigram = first[i] + first[i + 2];
      const altCount = firstAltBigrams.has(altBigram) ? firstAltBigrams.get(altBigram) + 1 : 1;
      firstAltBigrams.set(altBigram, altCount);
    }
  };

  let intersectionSize = 0;
  const altRatio = Math.max(0.2, 1.0 - 0.05 * first.length);
  
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second[i] + second[i + 1];

    if (firstBigrams.has(bigram)) {
      const count = firstBigrams.get(bigram);
      if (count > 0) {
        firstBigrams.set(bigram, count - 1);
        intersectionSize++;
        continue;
      }
    }
    if (firstReverseBigrams.has(bigram)) {
      const count = firstReverseBigrams.get(bigram);
      if (count > 0) {
        firstReverseBigrams.set(bigram, count - 1);
        intersectionSize += altRatio;
        continue;
      }
    }
    if (firstAltBigrams.has(bigram)) {
      const count = firstAltBigrams.get(bigram);
      if (count > 0) {
        firstAltBigrams.set(bigram, count - 1);
        intersectionSize += altRatio;
      }
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2);
}