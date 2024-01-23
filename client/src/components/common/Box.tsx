import { CSSProperties, FC, ReactNode } from "react";

interface BoxProps {
  children: ReactNode;
  style?: CSSProperties;
}

export const Box: FC<BoxProps> = ({ children, style, ...props }) => {
  return (
    <section
      {...props}
      style={{
        border: "1px solid lightgrey",
        borderRadius: "5px",
        padding: "2%",
        ...style,
      }}
    >
      {children}
    </section>
  );
};
