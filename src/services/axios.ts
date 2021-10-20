import axios from 'axios';
import { getRefreshToken, setRefreshToken, removeAccessToken, getAccessToken, setAccessToken, consumePkcePair, getAppHomeURL } from 'helpers';

const instance = axios.create({
    headers: {
        "Content-Type": "application/json",
    }
});

let globalErrorCallback: (msg: string) => void = () => { };

export const setGlobalErrorCallback = (callback: (msg: string) => void) => {
    globalErrorCallback = callback;
}

instance.interceptors.response.use(
    (res) => {
        return res
    },
    async (err) => {
        const config = err.config

        if (err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !config._retry) {
                delete instance.defaults.headers.common.Authorization
                removeAccessToken()
                config._retry = true
                try {
                    const params = new URLSearchParams()
                    params.append('grant_type', 'refresh_token')
                    params.append('refresh_token', getRefreshToken() || "")
                    params.append('client_id', process.env.REACT_APP_SPOTIFY_CLIENT_ID || "")
                    const rs = await instance.post('https://accounts.spotify.com/api/token',
                        params, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        }
                    })
                    setRefreshToken(rs.data.refresh_token)
                    const accessToken = rs.data.access_token
                    setAccessToken(accessToken)
                    instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
                    config.headers.Authorization = `Bearer ${accessToken}`
                    return instance(config)
                } catch (_error) {
                    return Promise.reject(_error)
                }
            }
            globalErrorCallback(err.response.status + (err.response.data && (' ' + JSON.stringify(err.response.data))));
        }
        return Promise.reject(err);
    }
)

export const retrieveAccessToken = (access_code: string) => {
    const params = new URLSearchParams()
    const pkcePair = consumePkcePair()
    params.append('code', access_code)
    params.append('redirect_uri', getAppHomeURL() + "/callback")
    params.append('grant_type', 'authorization_code')
    params.append('code_verifier', pkcePair.codeVerifier)
    params.append('client_id', process.env.REACT_APP_SPOTIFY_CLIENT_ID || "")

    return instance.post('https://accounts.spotify.com/api/token',
        params, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
}

const accessToken = getAccessToken()
if (accessToken) {
    instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`
}

export default instance;