# BlindTesTwitch

A **Blind-Test** web-application written in React, using Spotify/Twitch APIs

<kbd>
    <img src="https://i.imgur.com/EkIW17l.gif" />
</kbd>

## Description

The streamer logs in to their Spotify account from the application, configures the name of their Twitch channel and the device on which to play the music, then selects one of their playlists.

Once everything is setup, the application displays the blind-test view that the streamer can capture/stream, along with its Spotify sound. It displays the leaderboard, and the current song's items to guess.

The viewers type their guesses in the chat when a song plays, and the app will read chat messages to determine who found the correct answer(s) first, and reward them with points.

## Screenshots

![Playlist selection](https://i.imgur.com/jJjUIZK.png "Playlist selection")
![Playlist edition](https://i.imgur.com/izLCyaY.png "Playlist edition")
![Track edition](https://i.imgur.com/IDEZz6L.png "Track edition")

## Configuration

A few environment variables must be set in the `.env` file :
- REACT_APP_SPOTIFY_CLIENT_ID : (mandatory) Your Spotify app clientId
- REACT_APP_TWITCH_CLIENT_ID : (optional) Your Twitch app clientId

The Spotify app is mandatory : https://developer.spotify.com/dashboard/ (set redirect URI to `https://<domain>/BlindTesTwitch/callback`)   
The Twitch app is optional (the chat notifications won't be available, but that does not prevent the application from working) : https://dev.twitch.tv/console/apps (set redirect URI to `https://<domain>/BlindTesTwitch/settings`)   

Note : The application can be deployed on Github Pages, thanks to https://github.com/rafgraph/spa-github-pages