# BlindTesTwitch

A **Blind-Test** web-application written in React, using Spotify/Twitch APIs

You're a streamer and you want to use the app ?   
The application is deployed and ready to use !   
Just contact me on Discord (**neumann__**) so I can whitelist you 😊

## Description

TL;DR; Log in your Spotify and Twitch accounts, chose your playlist in the list, start the game with your viewers.

BlindTesTwitch is a all-in-one webapp: it controls your Spotify to launch the tracks, it displays the leaderboard and it reads your twitch chat to check the answers and give points to the fastest players.

- Live leaderboard
- Typo tolerance
- Playlist edition (remove tracks, edit/hide/add any values to guess)

<kbd>
    <img src="https://i.imgur.com/OVHnnXW.gif" />
</kbd>

## Configuration (if you want to deploy it yourself)

A few environment variables must be set in the `.env` file :
- REACT_APP_SPOTIFY_CLIENT_ID : (mandatory) Your Spotify app clientId
- REACT_APP_TWITCH_CLIENT_ID : (mandatory) Your Twitch app clientId

Both Spotify and Twitch apps are mandatory (set redirect URI to `https://<domain>/BlindTesTwitch/callback` for both) :
- https://developer.spotify.com/dashboard/
- https://dev.twitch.tv/console/apps/

Note : The application can be deployed on Github Pages, thanks to https://github.com/rafgraph/spa-github-pages
