import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
export async function uploadFileToIPFS(file) {
    const pinataApiKey = process.env.VITE_PINATA_API_KEY;
    const pinataSecretApiKey = process.env.VITE_PINATA_SECRET_API_KEY;
    if (!pinataApiKey || !pinataSecretApiKey) {
        throw new Error('Pinata API keys are missing in environment variables');
    }
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    // Create form data
    const data = new FormData();
    // Create a stream from the buffer since multer stores in memory (or we can use stream if stored on disk)
    // Assuming memory storage for now as it's cleaner for serverless-like environments, 
    // but if multer is configured for disk, we'd use fs.createReadStream(file.path)
    // If file.buffer is available (MemoryStorage)
    if (file.buffer) {
        data.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });
    }
    else if (file.path) {
        // If DiskStorage is used
        data.append('file', fs.createReadStream(file.path));
    }
    else {
        throw new Error('File buffer or path not found');
    }
    const res = await axios.post(url, data, {
        maxBodyLength: Infinity, // Important for large files
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}`,
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretApiKey,
        },
    });
    return res.data.IpfsHash;
}
