import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'TuitionTrack';

if (!uri) {
  console.error('FATAL: MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      connectTimeoutMS: 15000,
    });

    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB Atlas: database "${dbName}"`);

    // Ensure collections and indexes
    await initIndexes(db);

    return db;
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error.message);
    throw error;
  }
}

async function initIndexes(database) {
  try {
    const students = database.collection('students');
    await students.createIndex({ status: 1 });
    await students.createIndex({ name: 1 });

    const classes = database.collection('classes');
    // Unique compound index so a student cannot have duplicate classes on the same date
    await classes.createIndex({ studentId: 1, date: 1 }, { unique: true });
    await classes.createIndex({ date: 1 });
    await classes.createIndex({ status: 1 });

    const payments = database.collection('payments');
    await payments.createIndex({ studentId: 1, month: 1, year: 1 });
    await payments.createIndex({ paymentDate: -1 });

    const notifications = database.collection('notifications');
    // Unique index to prevent duplicate monthly notifications for the same student, month, and year
    await notifications.createIndex({ studentId: 1, month: 1, year: 1 }, { unique: true });
    await notifications.createIndex({ isRead: 1 });
    await notifications.createIndex({ createdAt: -1 });

    console.log('MongoDB indexes initialized successfully');
  } catch (err) {
    console.warn('Warning during index initialization:', err.message);
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}

export async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}
