const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
};

const targetDir = 'd:/JellyFish/nihongo-reflex/public/sounds';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

Promise.all([
  download('https://soundbible.com/grab.php?id=1705&type=mp3', path.join(targetDir, 'click.mp3')),
  download('https://soundbible.com/grab.php?id=1626&type=mp3', path.join(targetDir, 'check.mp3')),
  download('https://soundbible.com/grab.php?id=1351&type=mp3', path.join(targetDir, 'trash.mp3')),
  download('https://soundbible.com/grab.php?id=1787&type=mp3', path.join(targetDir, 'alarm.mp3'))
]).then(() => console.log('Successfully downloaded all real sound files!')).catch(console.error);
