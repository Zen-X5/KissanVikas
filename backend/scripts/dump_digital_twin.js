const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = 'mongodb://sahidwork123_db_user:z6R4omG7fOj9J9MB@ac-khjjwbw-shard-00-00.o8uvbcs.mongodb.net:27017,ac-khjjwbw-shard-00-01.o8uvbcs.mongodb.net:27017,ac-khjjwbw-shard-00-02.o8uvbcs.mongodb.net:27017/KissanVikas?ssl=true&replicaSet=atlas-6xi7mc-shard-0&authSource=admin&appName=Cluster0';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully.');
    const db = client.db('KissanVikas');
    
    // Fetch digitaltwins collection
    const digitalTwins = await db.collection('digitaltwins').find({}).toArray();
    console.log(`Found ${digitalTwins.length} digital twin document(s).`);

    const outputPath = path.join(__dirname, '..', '..', 'digital_twin_complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(digitalTwins.length === 1 ? digitalTwins[0] : digitalTwins, null, 2), 'utf-8');
    console.log(`Saved complete JSON to ${outputPath}`);

    // If there are other collections, let's also inspect them
    const collections = await db.listCollections().toArray();
    console.log('All collections:', collections.map(c => c.name));
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`- ${c.name}: ${count} document(s)`);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    await client.close();
  }
}

run();
