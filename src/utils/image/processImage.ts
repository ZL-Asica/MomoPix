const processImage = async (file: File): Promise<Blob> => {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);

  await new Promise((resolve) => img.addEventListener('load', resolve));

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const context = canvas.getContext('2d');
  if (context) {
    context.drawImage(img, 0, 0);
  } else {
    throw new Error('Failed to get canvas context');
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else throw new Error('Failed to process image');
      },
      'image/avif', // Target format
      0.7 // Compression quality
    );
  });
};

export default processImage;
