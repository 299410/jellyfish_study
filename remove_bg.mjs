import sharp from 'sharp';

async function removeBackground() {
  console.log('Starting background removal...');
  try {
    const inputPath = 'public/logo_temp.png';
    const outputPath = 'public/logo-mascot.png';

    // Get raw pixel data
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels; // Should be 4 (RGBA)

    // Flood fill algorithm to make background transparent
    // We assume the background color is similar to the top-left pixel (0,0)
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    const tolerance = 40; // color tolerance

    function colorMatch(index) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      return Math.abs(r - bgR) < tolerance && 
             Math.abs(g - bgG) < tolerance && 
             Math.abs(b - bgB) < tolerance;
    }

    const visited = new Uint8Array(width * height);
    const queue = [0]; // Start at (0,0)
    visited[0] = 1;

    // Additional seed points at the other corners just in case
    const corners = [
      0, // top-left
      width - 1, // top-right
      (height - 1) * width, // bottom-left
      (height - 1) * width + (width - 1) // bottom-right
    ];

    for (let c of corners) {
      if (!visited[c] && colorMatch(c * channels)) {
        queue.push(c);
        visited[c] = 1;
      }
    }

    let qIndex = 0;
    while (qIndex < queue.length) {
      const p = queue[qIndex++];
      const x = p % width;
      const y = Math.floor(p / width);

      // Make pixel transparent
      const idx = p * channels;
      data[idx + 3] = 0; // Set Alpha to 0

      // Check 4 neighbors
      const neighbors = [];
      if (x > 0) neighbors.push(p - 1);
      if (x < width - 1) neighbors.push(p + 1);
      if (y > 0) neighbors.push(p - width);
      if (y < height - 1) neighbors.push(p + width);

      for (let n of neighbors) {
        if (!visited[n] && colorMatch(n * channels)) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }

    // Write the new image
    await sharp(data, {
      raw: {
        width,
        height,
        channels
      }
    })
    .png()
    .toFile(outputPath);

    console.log('Successfully created', outputPath);
  } catch (err) {
    console.error('Error:', err);
  }
}

removeBackground();
