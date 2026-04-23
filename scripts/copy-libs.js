import fs from 'fs';
import path from 'path';

const copyFiles = () => {
    const publicLibsDir = path.resolve(process.cwd(), 'public/libs');
    const vadDistDir = path.resolve(process.cwd(), 'node_modules/@ricky0123/vad-web/dist');
    const onnxDistDir = path.resolve(process.cwd(), 'node_modules/onnxruntime-web/dist');
    const live2dCoreFile = path.resolve(process.cwd(), 'WebSDK/Core/live2dcubismcore.js');

    if (!fs.existsSync(publicLibsDir)) {
        fs.mkdirSync(publicLibsDir, { recursive: true });
    }

    // copy live2d
    if (fs.existsSync(live2dCoreFile)) {
        fs.copyFileSync(live2dCoreFile, path.join(publicLibsDir, 'live2dcubismcore.js'));
        console.log('Copied live2dcubismcore.js');
    }

    // copy vad files
    if (fs.existsSync(vadDistDir)) {
        const vadFiles = ['vad.worklet.bundle.min.js', 'silero_vad_v5.onnx', 'silero_vad_legacy.onnx'];
        vadFiles.forEach(f => {
            const p = path.join(vadDistDir, f);
            if (fs.existsSync(p)) fs.copyFileSync(p, path.join(publicLibsDir, f));
            console.log('Copied', f);
        });
    }

    // copy onnx wasm files
    if (fs.existsSync(onnxDistDir)) {
        const files = fs.readdirSync(onnxDistDir);
        files.forEach(f => {
            if (f.endsWith('.wasm')) {
                fs.copyFileSync(path.join(onnxDistDir, f), path.join(publicLibsDir, f));
                console.log('Copied', f);
            }
        });
    }
};

copyFiles();
