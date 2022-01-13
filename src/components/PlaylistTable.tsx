import { useContext, useEffect, useState } from 'react'
import { FormControl, Form, InputGroup } from "react-bootstrap"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import PlaylistsData from "./data/PlaylistsData"
import PlaylistRow from "./PlaylistRow"
import Paginator from "./Paginator"
import { BlindTestContext } from 'App'

const PlaylistTable = () => {
  const PAGE_SIZE = 20;
  const playlistsData = new PlaylistsData(); // TODO put cache in state

  const { setSubtitle } = useContext(BlindTestContext);
  
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [query, setQuery] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [playlistCount, setPlaylistCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const min = ((currentPage - 1) * PAGE_SIZE) + 1;
    const max = Math.min(min + PAGE_SIZE - 1, playlistCount);
    setSubtitle(`${min}-${max} of ${playlistCount} playlists`);
  }, [setSubtitle, currentPage, playlistCount]);

  useEffect(() => {
    loadCurrentPlaylistPage();
  }, [currentPage]);

  const playlistSearch = async () => {
    if (query.length === 0) {
      playlistSearchCancel()
    } else {
      setSearchSubmitted(true);
      const playlists = await playlistsData.search(query)
      setPlaylists(playlists);
      setPlaylistCount(playlists.length);
      setCurrentPage(1);

      if (playlists.length === playlistsData.SEARCH_LIMIT) {
        setSubtitle(`First ${playlists.length} results with "${query}" in playlist name`)
      } else {
        setSubtitle(`${playlists.length} results with "${query}" in playlist name`)
      }
    }
  }

  const playlistSearchCancel = () => {
    setSearchSubmitted(false);
    return loadCurrentPlaylistPage();
  }

  const loadCurrentPlaylistPage = async () => {
    setQuery('');

    const playlists = await playlistsData.slice(
      ((currentPage - 1) * PAGE_SIZE),
      ((currentPage - 1) * PAGE_SIZE) + PAGE_SIZE
    )

    setInitialized(true);
    setPlaylists(playlists);

    const count = await playlistsData.total();
    setPlaylistCount(count);
  }

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);
  }

  const handleSearchKeyDown = (event: any) => {
    event.stopPropagation()
    if (event.key === 'Enter') {
      playlistSearch()
      event.preventDefault()
    } else if (event.key === 'Escape') {
      playlistSearchCancel()
    }
  }

  if (initialized) {
    const icon = (searchSubmitted)
      ? <FontAwesomeIcon icon={['fas', 'times']} size="sm" onClick={playlistSearchCancel} className="closeIcon" />
      : <FontAwesomeIcon icon={['fas', 'search']} size="sm" onClick={playlistSearch} className="searchIcon" />
    const className = query.length > 0 ? "search queryPresent" : "search"

    return (
      <div id="playlists">
        <div id="playlistsHeader">
          <Paginator currentPage={currentPage} pageLimit={PAGE_SIZE} totalRecords={playlistCount} onPageChanged={handlePageChanged} />
          <Form className={className}>
            <InputGroup>
              <FormControl value={query} type="text" role="searchbox" placeholder="Search" size="sm" onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearchKeyDown} className="border-right-0 border"/>
              <InputGroup.Text className="bg-transparent">
                {icon}
              </InputGroup.Text>
            </InputGroup>
          </Form>
        </div>
        <table className="table table-hover table-sm">
          <thead>
            <tr>
              <th style={{ width: "30px" }}></th>
              <th>Name</th>
              <th style={{ width: "150px" }}>Owner</th>
              <th style={{ width: "100px" }}>Tracks</th>
              <th style={{ width: "120px" }}>Public?</th>
              <th style={{ width: "100px" }}> </th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((playlist) => {
              return <PlaylistRow
                playlist={playlist}
                key={playlist.id}
              />
            })}
          </tbody>
        </table>
        <div id="playlistsFooter">
          <Paginator currentPage={currentPage} pageLimit={PAGE_SIZE} totalRecords={playlistCount} onPageChanged={handlePageChanged} />
        </div>
      </div>
    );
  } else {
    return <div className="spinner"></div>
  }
}

export default PlaylistTable
