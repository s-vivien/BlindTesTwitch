import axios from "axios";
import { useAuthStore } from "components/store/AuthStore";

const instance = axios.create({
  headers: {
    "Content-Type": "application/json",
  }
});

export const setDefaultAuth = (accessToken: string) => {
  instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
  instance.defaults.headers.common['Client-Id'] = process.env.REACT_APP_TWITCH_CLIENT_ID || ""
}

export const validateToken = (token: string) => {
  const headers = { 'Authorization': `Bearer ${token}` }
  return fetch('https://id.twitch.tv/oauth2/validate', { headers });
}

export const getUsers = (ids: string[]) => {
  return instance.get(`https://api.twitch.tv/helix/users?${ids.map(id => `id=${id}`).join('&')}`);
}