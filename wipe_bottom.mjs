import sharp from 'sharp';

async function wipeBottom() {
  const inputPath = 'public/logo-mascot.png';
  const outputPath = 'public/logo-clean.png';

  try {
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Wipe anything below Y=800 (about bottom 20% of the image)
    const wipeY = 820; 
    
    for (let y = wipeY; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        data[idx + 3] = 0; // set alpha to 0
      }
    }

    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels }
    }).png().toFile(outputPath);
    
    console.log('Successfully removed watermark at the bottom!');
  } catch (e) {
    console.error(e);
  }
}
wipeBottom();
