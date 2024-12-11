
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { useAuthStore } from "./store/AuthStore";

const GlobalMenu = ({
  onSettingsClick,
  onPlaylistClick,
  onHelpClick,
  onChangelogClick,
  onSupportMeClick,
  onLogoutClick,
}: any) => {

  const twitchAvatar = useAuthStore((state) => state.twitchAvatar);

  const CustomToggle = React.forwardRef<HTMLDivElement, { onClick: (e: React.MouseEvent<HTMLDivElement>) => void }>(
    ({ onClick }, ref) => (
      <div ref={ref} onClick={(e) => { e.preventDefault(); onClick(e); }} style={{ fontSize: 'large', backgroundColor: 'yellow', borderRadius: '35px', display: "inline-block" }}    >
        <FontAwesomeIcon icon={['fas', 'bars']} size="lg" style={{ margin: '0 0.25rem 0 0.5rem' }} />
        <img src={twitchAvatar} style={{ height: '35px', borderRadius: '100%' }} />
      </div>
    )
  );

  return (
    <Dropdown style={{ display: "inline-block" }} data-bs-theme="dark">
      <Dropdown.Toggle as={CustomToggle} />
      <Dropdown.Menu>
        <Dropdown.Item onClick={onSettingsClick}>Settings</Dropdown.Item>
        <Dropdown.Item onClick={onPlaylistClick}>Playlist</Dropdown.Item>
        <Dropdown.Item onClick={onHelpClick}>Help</Dropdown.Item>
        <Dropdown.Item onClick={onChangelogClick}>Changelog</Dropdown.Item>
        <Dropdown.Item onClick={onSupportMeClick}>Support me</Dropdown.Item>
        <Dropdown.Item onClick={onLogoutClick}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default GlobalMenu;