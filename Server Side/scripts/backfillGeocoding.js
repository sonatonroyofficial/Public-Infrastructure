import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { geocodeAddress } from '../services/geocoding.js';

dotenv.config({ path: './.env' });
dotenv.config({ path: './.env.local' });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://sonatonroyofficial:sonaton123@cluster0.aemq5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = 'infrastructure_reporting';

async function runBackfill() {
    console.log('🚀 Starting Geocoding Backfill Script for InfraReport...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        const db = client.db(dbName);
        const issuesCollection = db.collection('issues');

        // Find reports without coordinates or with pending geocoding status
        const query = {
            $or: [
                { geocodingStatus: { $ne: 'success' } },
                { latitude: null },
                { latitude: 0 },
                { district: null }
            ]
        };

        const pendingReports = await issuesCollection.find(query).toArray();
        console.log(`📋 Found ${pendingReports.length} report(s) needing geocoding backfill.`);

        if (pendingReports.length === 0) {
            console.log('🎉 All reports already have valid geocoding data. Nothing to backfill!');
            return;
        }

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < pendingReports.length; i++) {
            const report = pendingReports[i];
            const address = report.location?.address || report.title || '';
            const existingLat = report.location?.latitude || report.latitude;
            const existingLng = report.location?.longitude || report.longitude;

            console.log(`\n[${i + 1}/${pendingReports.length}] Processing Report ID: ${report._id}`);
            console.log(`📍 Address: "${address}"`);

            const geoResult = await geocodeAddress(address, existingLat, existingLng);

            const updatePayload = {
                latitude: geoResult.latitude,
                longitude: geoResult.longitude,
                district: geoResult.district || "Dhaka",
                geocodingStatus: geoResult.geocodingStatus,
                "location.latitude": geoResult.latitude,
                "location.longitude": geoResult.longitude
            };

            await issuesCollection.updateOne(
                { _id: report._id },
                { $set: updatePayload }
            );

            if (geoResult.geocodingStatus === 'success') {
                successCount++;
                console.log(`✅ Success -> Lat: ${geoResult.latitude}, Lng: ${geoResult.longitude}, District: "${geoResult.district}"`);
            } else {
                failedCount++;
                console.log(`⚠️ Geocoding failed for address. Marked as failed.`);
            }

            // Rate limit delay: wait 1.1 seconds between requests to respect Nominatim policy (max 1 req/sec)
            if (i < pendingReports.length - 1) {
                console.log('⏳ Waiting 1.1s for rate limit...');
                await new Promise(resolve => setTimeout(resolve, 1100));
            }
        }

        console.log('\n========================================');
        console.log('📊 BACKFILL COMPLETE SUMMARY');
        console.log(`- Total Processed: ${pendingReports.length}`);
        console.log(`- Successfully Geocoded: ${successCount}`);
        console.log(`- Failed / Unresolved: ${failedCount}`);
        console.log('========================================');

    } catch (error) {
        console.error('❌ Error during backfill:', error);
    } finally {
        await client.close();
        console.log('👋 Connection closed.');
    }
}

runBackfill();
