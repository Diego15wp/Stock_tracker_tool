import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';

async function testDatabaseConnection() {
    console.log('\n🧪 Testing Database Connection...\n');
    console.log(`📍 Target: ${MONGODB_URI}\n`);

    try {
        // Test 1: Connection
        console.log('1️⃣  Attempting to connect to MongoDB...');
        const connection = await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });
        console.log('✅ Successfully connected to MongoDB!\n');

        // Test 2: Check connection state
        console.log('2️⃣  Checking connection state...');
        console.log(`   Connection State: ${connection.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
        console.log(`   Host: ${connection.connection.host}`);
        console.log(`   Port: ${connection.connection.port}`);
        console.log(`   Database: ${connection.connection.name}\n`);

        // Test 3: Server info
        console.log('3️⃣  Retrieving server information...');
        const admin = connection.connection.getClient().db().admin();
        const serverStatus = await admin.serverStatus();
        console.log(`   MongoDB Version: ${serverStatus.version}`);
        console.log(`   Uptime: ${serverStatus.uptime} seconds\n`);

        // Test 4: List databases
        console.log('4️⃣  Listing available databases...');
        const databases = await admin.listDatabases();
        console.log(`   Total databases: ${databases.databases.length}`);
        databases.databases.slice(0, 5).forEach((db) => {
            console.log(`   - ${db.name}`);
        });
        if (databases.databases.length > 5) {
            console.log(`   ... and ${databases.databases.length - 5} more\n`);
        } else {
            console.log('');
        }

        // Test 5: Test write and read
        console.log('5️⃣  Testing write/read operations...');
        const testCollection = connection.connection.collection('_connection_test');
        const testDoc = { timestamp: new Date(), message: 'Connection test document' };
        const insertResult = await testCollection.insertOne(testDoc);
        console.log(`   ✓ Document inserted with ID: ${insertResult.insertedId}`);

        const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
        console.log(`   ✓ Document retrieved successfully`);
        console.log(`   ✓ Message: "${readResult?.message}"\n`);

        // Clean up
        await testCollection.deleteOne({ _id: insertResult.insertedId });
        console.log('6️⃣  Test document cleaned up\n');

        console.log('🎉 All tests passed! Your database connection is working properly.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection test failed!\n');
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
            console.error(`\n📋 Troubleshooting tips:`);
            console.error(`  • Ensure MongoDB is running (check with: mongod --version)`);
            console.error(`  • Verify MONGODB_URI is correct in your .env file`);
            console.error(`  • Check your network connection if using cloud MongoDB`);
            console.error(`  • Verify MongoDB credentials if authentication is enabled\n`);
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

testDatabaseConnection();
