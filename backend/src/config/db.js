import mongoose from 'mongoose';
import { env } from './env.js';

let connected = false;

export async function connectDb() {
  if (connected) return mongoose.connection;

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
  });
  connected = true;
  return mongoose.connection;
}

export async function disconnectDb() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
