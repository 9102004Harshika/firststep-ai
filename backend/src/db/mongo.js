import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client;
let db;

export async function connectMongo() {
  if (db) return db;

  client = new MongoClient(env.mongodbUri);
  await client.connect();
  db = client.db(env.mongodbDbName);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}
