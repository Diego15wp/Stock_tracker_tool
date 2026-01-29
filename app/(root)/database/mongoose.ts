import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    };
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI){
        throw new Error('MONGODB_URI must be set within .env')
    }

    // NextJS tends to request a new connection upon every hot reload
    // If a connection is already established or if there is a cached connection
    // use it, otherwise create a new one. We do not want multipe db connections.  
    if(cached.conn) return cached.conn;
    if(!cached.promise){
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false});
    }

    try {
        cached.conn = await cached.promise;
    } catch(err){
        cached.promise = null;
        throw err;
    }
    console.log(`Connected to ${process.env.NODE_ENV} - ${MONGODB_URI}`);
}