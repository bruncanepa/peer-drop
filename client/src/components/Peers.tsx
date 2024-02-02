import { FC } from "react";

export type PeersItem = { id: string; alias: string };

interface PeersProps {
  items: PeersItem[];
}

export const Peers: FC<PeersProps> = ({ items }) => {
  return (
    <>
      <h3>Peers</h3>
      {items.length ? (
        <ol>
          {items.map((peer) => (
            <li key={peer.id}>{peer.alias}</li>
          ))}
        </ol>
      ) : (
        <span>No peers connected yet</span>
      )}
    </>
  );
};
