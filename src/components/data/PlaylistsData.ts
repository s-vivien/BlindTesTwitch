import { getPlaylists } from "services/SpotifyAPI"

// Handles cached loading of all or subsets of playlist data
class PlaylistsData {
  PLAYLIST_LIMIT = 50
  SEARCH_LIMIT = 20

  data: any[]
  dataInitialized = false

  constructor() {
    this.data = []
  }

  async total() {
    if (!this.dataInitialized) {
      await this.loadSlice()
    }

    return this.data.length
  }

  async slice(start: number, end: number) {
    await this.loadSlice(start, end)
    return this.data.slice(start, end)
  }

  async search(query: string) {
    await this.loadAll()
    // Case-insensitive search in playlist name
    return this.data
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, this.SEARCH_LIMIT)
  }

  async loadAll() {
    await this.loadSlice()

    // Get the rest of them if necessary
    for (var offset = this.PLAYLIST_LIMIT; offset < this.data.length; offset = offset + this.PLAYLIST_LIMIT) {
      await this.loadSlice(offset, offset + this.PLAYLIST_LIMIT)
    }
  }

  async loadSlice(start = 0, end = start + this.PLAYLIST_LIMIT) {
    if (this.dataInitialized) {
      const loadedData = this.data.slice(start, end)

      if (loadedData.filter(i => !i).length === 0) {
        return loadedData
      }
    }

    const playlistsResponse = await getPlaylists(start, this.PLAYLIST_LIMIT)
    if (playlistsResponse.status !== 200) return;
    const playlistsData = playlistsResponse.data

    if (!this.dataInitialized) {
      this.data = Array(playlistsData.total).fill(null)
      this.dataInitialized = true
    }

    this.data.splice(start, playlistsData.items.length, ...playlistsData.items)
  }
}

export default PlaylistsData
