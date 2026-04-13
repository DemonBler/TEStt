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
  
  console.log('Downloading test.vrma...');
  await download(
    'https://raw.githubusercontent.com/pixiv/three-vrm/dev/packages/three-vrm-animation/examples/models/test.vrma',
    'public/animations/test.vrma'
  );
  console.log('Downloaded test.vrma');
}

main().catch(console.error);
