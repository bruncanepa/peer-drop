import { useRef, MutableRefObject } from "react";
import { useForceUpdate } from "./useForceUpdate";

export const useUpdatableRef = <T>(
  initialValue: T
): [MutableRefObject<T>, (v: T) => any] => {
  const forceUpdate = useForceUpdate();
  const ref = useRef<T>(initialValue);

  const updateRef = (val: T) => {
    ref.current = val;
    forceUpdate();
  };

  return [ref, updateRef];
};
