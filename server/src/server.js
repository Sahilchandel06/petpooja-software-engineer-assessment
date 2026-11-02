import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import MoveOperation from './models/MoveOperation.js';

const port = Number(process.env.PORT) || 5000;
const mongoUri = process.env.MONGO_URI;

async function start() {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required. Copy server/.env.example to server/.env.');
  }

  // Start listening only after MongoDB is reachable so the API never advertises a dead database.
  await mongoose.connect(mongoUri);
  // Build the unique operation key and TTL indexes before accepting move requests.
  await MoveOperation.init();
  app.listen(port, () => {
    console.info(`TaskFlow API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start TaskFlow API:', error.message);
  process.exitCode = 1;
});
