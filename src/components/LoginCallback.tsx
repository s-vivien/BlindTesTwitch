import { setStoredAccessToken, setStoredRefreshToken, getQueryParam, setStoredUserCountry } from "helpers"
import { useNavigate } from "react-router-dom";
import instance, { getUserProfile, retrieveAccessToken } from 'services/SpotifyAPI'
import { useContext, useEffect } from 'react'
import { BlindTestContext } from "App";

const LoginCallback = () => {

  const { setLoggedIn } = useContext(BlindTestContext);
  const navigate = useNavigate()

  useEffect(() => {
    const code = getQueryParam('code')
    if (code) {
      retrieveAccessToken(code).then(response => {
        setStoredRefreshToken(response.data.refresh_token);
        const accessToken = response.data.access_token;
        setStoredAccessToken(accessToken);
        instance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        setLoggedIn(true);
        getUserProfile().then(response => {
          setStoredUserCountry(response.data.country);
        });
        navigate("/");
      })
    } else {
      navigate("/")
    }
  }, [navigate, setLoggedIn]);

  return (
    <div className="spinner"></div>
  )
}

export default LoginCallback
