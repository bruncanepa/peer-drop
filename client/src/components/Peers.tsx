import { FC } from "react";

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
            <li key={peer}>{peer}</li>
          ))}
        </ol>
      ) : (
        <span>No peers connected yet</span>
      )}
    </>
  );
};
