import { FC } from "react";
import { idToShortId } from "utils/id";

interface PeersProps {
  items: string[];
}

export const Peers: FC<PeersProps> = ({ items }) => {
  return (
    <>
      <h3>Peers</h3>
      {items.length ? (
        <ol>
          {items.map((peer) => (
            <li key={peer}>{idToShortId(peer)}</li>
          ))}
        </ol>
      ) : (
        <span>No peers connected yet</span>
      )}
    </>
  );
};
