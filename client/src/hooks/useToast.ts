import { UseToastOptions, useToast as useToastChakra } from "@chakra-ui/react";

const toastDefaultProps: UseToastOptions = { duration: null, isClosable: true };

export const useToast = () => {
  const toast = useToastChakra();

  const success = (title: string) =>
    toast({ ...toastDefaultProps, title, status: "success" });
  const info = (title: string) =>
    toast({ ...toastDefaultProps, title, status: "info" });
  const error = (err: Error, title?: string) =>
    toast({
      ...toastDefaultProps,
      title: err.message
        ? `${title}${err.message}`
        : title || "An error ocurred",
      status: "error",
    });

  return { success, info, error };
};
