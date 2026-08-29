import * as dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadMissionFrames(missionId: string = 'MISSION-996924') {
  console.log(`\n☁️ Uploading frames for mission: ${missionId} to Cloudinary...`);
  
  const missionDir = path.resolve('D:/KissanVikas/simulation/media/surveys', missionId);
  if (!fs.existsSync(missionDir)) {
    console.error(`❌ Mission directory not found: ${missionDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(missionDir).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`📸 Found ${files.length} frames to upload.`);

  let uploaded = 0;
  for (const file of files) {
    const frameId = path.basename(file, path.extname(file));
    const fullPath = path.join(missionDir, file);

    try {
      const res = await cloudinary.uploader.upload(fullPath, {
        folder: `kissanvikas/surveys/${missionId}`,
        public_id: frameId,
        overwrite: true,
        resource_type: 'image',
      });
      uploaded += 1;
      if (uploaded % 10 === 0 || uploaded === files.length) {
        console.log(`  [${uploaded}/${files.length}] Uploaded ${frameId} -> ${res.secure_url}`);
      }
    } catch (err: any) {
      console.warn(`  ⚠️ Failed to upload ${file}: ${err.message}`);
    }
  }

  console.log(`\n✅ Completed! Successfully uploaded ${uploaded}/${files.length} frames to Cloudinary.\n`);
}

const targetMission = process.argv[2] || 'MISSION-996924';
uploadMissionFrames(targetMission).catch(console.error);
