import imageCompression from 'browser-image-compression';

const processImage = async (file: File): Promise<Blob> => {
  const options = {
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    fileType: 'image/avif',
    maxIteration: 10,
    initialQuality: 0.9,
  };

  return await imageCompression(file, options);
};

export default processImage;
