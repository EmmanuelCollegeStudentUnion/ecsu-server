
import fs from 'fs';
export default function resize(path, format, width, height) {
    const readStream = fs.createReadStream(path);
    return readStream;
}