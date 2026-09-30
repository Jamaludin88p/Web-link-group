const { MongoClient } = require("mongodb");

// Koneksi dipakai ulang antar request supaya tidak konek ulang tiap kali.
const cache = global.__linkgcMongo || (global.__linkgcMongo = { promise: null });

async function getDb() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diatur");
  if (!cache.promise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000
    });
    cache.promise = client.connect()
      .then(async (c) => {
        const db = c.db(process.env.MONGODB_DB || "linkgc");
        await Promise.all([
          db.collection("groups").createIndex({ linkgc: 1 }, { unique: true }),
          db.collection("users").createIndex({ username: 1 }, { unique: true }),
          db.collection("attempts").createIndex({ at: 1 }, { expireAfterSeconds: 900 })
        ]);
        return db;
      })
      .catch((e) => { cache.promise = null; throw e; });
  }
  return cache.promise;
}

module.exports = { getDb };
