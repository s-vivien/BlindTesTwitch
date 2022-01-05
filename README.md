# BlindTesTwitch

A **Blind-Test** web-application written in React, using Spotify/Twitch APIs

<kbd>
    <img src="https://i.imgur.com/9tq4Xqp.gif" />
</kbd>

## Description

The streamer logs in to their Spotify account from the application, configures the name of their Twitch channel and the device on which to play the music, then selects one of their playlists.

Once everything is setup, the application displays the blind-test view that the streamer can capture/stream, along with its Spotify sound. It displays the leaderboard, and the current song's items to guess.

The viewers type their guesses in the chat when a song plays, and the app will read chat messages to determine who found the correct answer(s) first, and reward them with points.

## Configuration

A few environment variables must be set in the `.env` file :

- REACT_APP_SPOTIFY_CLIENT_ID : The Spotify app clientId. It's mandatory. See https://developer.spotify.com/dashboard/applications
- REACT_APP_TWITCH_USERNAME : (optional) The twitch account username used to display chat notifications
- REACT_APP_TWITCH_OAUTH_TOKEN : (optional) The twitch account oauth token used to display chat notifications

## TODO
- Fancy CSS animations
- Dark/Light mode
- Edit view to change/add inputs to guess