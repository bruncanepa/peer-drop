import { FC } from "react";
import { FlexProps, Text } from "@chakra-ui/react";
import { ActivityLog as ActivityLogClass } from "hooks/useActivityLog";
import { idToShortId } from "utils/id";
import { Box } from "./common/Box";

interface ActivityLogProps extends FlexProps {
  items: ActivityLogClass[];
  myId?: string;
}

export const ActivityLog: FC<ActivityLogProps> = ({
  items,
  myId,
  ...props
}) => {
  return (
    <Box direction="column" overflow="scroll" {...props}>
      <h3>Activity Log </h3>
      {!!myId && (
        <Text style={{ fontWeight: "bold", marginBottom: "5%" }}>
          You are: {idToShortId(myId)}
        </Text>
      )}
      {items.length ? (
        <table>
          <thead>
            <tr>
              <th>Peer</th>
              <th>Action</th>
              <th>Date</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {items.map((log) => (
              <tr
                key={log.date?.toISOString() + log.type}
                style={{ borderBottom: "1px solid lightgrey", padding: "2% 0" }}
              >
                <th>
                  {log.peerId === myId ? "Me" : idToShortId(log.peerId) || "Me"}
                </th>
                <th>{log.type}</th>
                <th>{log.date?.toISOString()}</th>
                <th>{log.data ? JSON.stringify(log.data) : "-"}</th>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Text>No logs yet</Text>
      )}
    </Box>
  );
};
