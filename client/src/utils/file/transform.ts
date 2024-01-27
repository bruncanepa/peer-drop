export class Transform {
  static blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onloadend = () => {
        resolve(fileReader.result as ArrayBuffer);
      };

      fileReader.onerror = () => {
        reject();
      };

      fileReader.readAsArrayBuffer(blob);
    });
  };
}
