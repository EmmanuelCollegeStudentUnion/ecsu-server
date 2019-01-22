
import fs from 'fs';
export default function resize(path, format, width, height) {
    const readStream = fs.createReadStream('./assets/images/' + path);
    return readStream;
}