import { UseToastOptions, useToast as useToastChakra } from "@chakra-ui/react";

const toastDefaultProps: UseToastOptions = { duration: 5000, isClosable: true };
const mergeOptions = (options: UseToastOptions) => ({
  ...toastDefaultProps,
  ...options,
});

export const useToast = () => {
  const toast = useToastChakra();

  const success = (title: string, options: UseToastOptions = {}) =>
    toast({ ...mergeOptions(options), title, status: "success" });
  const info = (title: string, options: UseToastOptions = {}) =>
    toast({ ...mergeOptions(options), title, status: "info" });
  const error = (err: Error, title?: string, options: UseToastOptions = {}) =>
    toast({
      ...mergeOptions(options),
      title: err.message
        ? `${title + " "}${err.message}`
        : title || "An error ocurred",
      status: "error",
    });

  return { success, info, error };
};
