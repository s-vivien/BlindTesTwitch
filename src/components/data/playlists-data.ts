import { getPlaylists } from 'services/spotify-api';

// Handles cached loading of all or subsets of playlist data
class PlaylistsData {
  data: any[];
  pageSize: number;
  dataInitialized = false;

  constructor(pageSize: number) {
    this.pageSize = pageSize;
    this.data = [];
  }

  async total() {
    if (!this.dataInitialized) {
      await this.loadSlice();
    }

    return this.data.length;
  }

  async slice(start: number, end: number) {
    await this.loadSlice(start, end);
    return this.data.slice(start, end);
  }

  async search(query: string) {
    await this.loadAll();
    // Case-insensitive search in playlist name
    return this.data
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, this.pageSize);
  }

  async loadAll() {
    await this.loadSlice();

    // Get the rest of them if necessary
    for (let offset = this.pageSize; offset < this.data.length; offset = offset + this.pageSize) {
      await this.loadSlice(offset, offset + this.pageSize);
    }
  }

  async loadSlice(start = 0, end = start + this.pageSize) {
    if (this.dataInitialized) {
      const loadedData = this.data.slice(start, end);

      if (loadedData.filter(i => !i).length === 0) {
        return loadedData;
      }
    }

    const playlistsResponse = await getPlaylists(start, this.pageSize);
    if (playlistsResponse.status !== 200) return;
    const playlistsData = playlistsResponse.data;

    if (!this.dataInitialized) {
      this.data = Array(playlistsData.total).fill(null);
      this.dataInitialized = true;
    }

    this.data.splice(start, playlistsData.items.length, ...playlistsData.items);
  }
}

export default PlaylistsData;
