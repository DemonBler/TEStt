import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  if (!fs.existsSync('public/animations')) {
    fs.mkdirSync('public/animations', { recursive: true });
  }
  
  console.log('Downloading idle_loop.vrma...');
  await download(
    'https://raw.githubusercontent.com/pixiv/ChatVRM/main/public/idle_loop.vrma',
    'public/animations/idle_loop.vrma'
  );
  console.log('Downloaded idle_loop.vrma');
}

main().catch(console.error);
