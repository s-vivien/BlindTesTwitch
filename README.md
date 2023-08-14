# BlindTesTwitch

A **Blind-Test** web-application written in React, using Spotify/Twitch APIs

You're a streamer and you want to try the app ?
The application is deployed and ready to use !
Just contact me on Discord (neumann__)

## Description

TL;DR; Log in your Spotify account, chose your playlist in the list, start the game with your viewers.

BlindTesTwitch is a webapp: login and stream your web-browser, the app lets you control the tracks, displays the leaderboard, etc.
The app reads your twitch chat, checks the answers and gives points to the fastest players.

- Live leaderboard
- Typo tolerance
- Playlist edition (remove tracks, edit/hide/add any values to guess)

<kbd>
    <img src="https://i.imgur.com/EkIW17l.gif" />
</kbd>


## Screenshots

![Playlist selection](https://i.imgur.com/jJjUIZK.png "Playlist selection")
![Playlist edition](https://i.imgur.com/bqHOfwD.png "Playlist edition")
![Track edition](https://i.imgur.com/HWTBrmI.png "Track edition")

## Configuration

A few environment variables must be set in the `.env` file :
- REACT_APP_SPOTIFY_CLIENT_ID : (mandatory) Your Spotify app clientId
- REACT_APP_TWITCH_CLIENT_ID : (mandatory) Your Twitch app clientId

Both Spotify and Twitch apps are mandatory (set redirect URI to `https://<domain>/BlindTesTwitch/callback` for both) :
- https://developer.spotify.com/dashboard/
- https://dev.twitch.tv/console/apps/

Note : The application can be deployed on Github Pages, thanks to https://github.com/rafgraph/spa-github-pages
