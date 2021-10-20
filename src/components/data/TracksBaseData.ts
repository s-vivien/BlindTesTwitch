import { getPlaylistTracks } from "services/SpotifyAPI"

class TracksBaseData {
  playlist: any

  constructor(playlist: any) {
    this.playlist = playlist
  }

  async trackItems() {
    await this.getPlaylistItems()
    return this.playlistItems
  }

  // Memoization supporting multiple calls
  playlistItems: any[] = []
  async getPlaylistItems() {
    if (this.playlistItems.length === 0) {
      var limit = 100
      for (var offset = 0; offset < this.playlist.tracks.total; offset = offset + limit) {
        const tracks = await getPlaylistTracks(this.playlist.id, offset, limit)
        if (tracks) this.playlistItems.push(...tracks.data.items.filter((i: any) => i.track))
      }
    }

    return this.playlistItems
  }
}

export default TracksBaseData
