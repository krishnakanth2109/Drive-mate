import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function checkAccount() {
  try {
    const ping = await cloudinary.api.ping();
    console.log('Ping result:', ping);
  } catch (err: any) {
    console.log('Ping failed:', err.message || err);
  }

  try {
    const usage = await cloudinary.api.usage();
    console.log('Usage result:', usage);
  } catch (err: any) {
    console.log('Usage failed:', err.message || err);
  }
}

checkAccount();
