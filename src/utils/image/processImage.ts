const processImageWithWorker = async (file: File): Promise<Blob> => {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(file);

  await new Promise((resolve) => {
    img.addEventListener('load', resolve);
  });

  const offscreen = new OffscreenCanvas(img.width, img.height);
  const context = offscreen.getContext('2d');
  if (context) {
    context.drawImage(img, 0, 0);
  } else {
    throw new Error('Failed to get OffscreenCanvas context');
  }

  return new Promise((resolve) => {
    offscreen
      .convertToBlob({
        type: 'image/avif',
        quality: 0.7,
      })
      .then(resolve);
  });
};

export default processImageWithWorker;
