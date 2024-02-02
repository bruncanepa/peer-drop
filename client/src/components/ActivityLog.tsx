import { FC } from "react";
import { FlexProps, Heading, Text } from "@chakra-ui/react";
import { ActivityLog as ActivityLogClass } from "hooks/useActivityLog";
import { Box } from "./common/Box";

interface ActivityLogProps extends FlexProps {
  items: ActivityLogClass[];
  myAlias?: string;
}

export const ActivityLog: FC<ActivityLogProps> = ({
  items,
  myAlias,
  ...props
}) => {
  return (
    <Box direction="column" overflow="scroll" {...props}>
      <Heading as="h3">Activity</Heading>
      {!!myAlias && (
        <Text style={{ fontWeight: "bold", marginBottom: "5%" }}>
          You are: '{myAlias}'
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
                <th>{log.alias}</th>
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
