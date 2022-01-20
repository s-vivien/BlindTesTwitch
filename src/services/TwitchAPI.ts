export const validateToken = (token: string) => {
  const headers = { 'Authorization': `Bearer ${token}` }
  return fetch('https://id.twitch.tv/oauth2/validate', { headers });
}