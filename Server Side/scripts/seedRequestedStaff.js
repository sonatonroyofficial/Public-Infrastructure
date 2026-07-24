import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function seedRequestedStaff() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('infrastructure_reporting');
        const staffList = [
            { name: 'City Staff Member', email: 'city@gmail.com', password: 'city123', role: 'staff' },
            { name: 'Water Department Staff', email: 'water@gmail.com', password: 'staff123', role: 'staff' },
            { name: 'Fire & Safety Staff', email: 'fire@gmail.com', password: 'fire123', role: 'staff' }
        ];

        for (const s of staffList) {
            const hashedPassword = await bcrypt.hash(s.password, 10);
            const existing = await db.collection('users').findOne({ email: s.email });

            if (existing) {
                await db.collection('users').updateOne(
                    { _id: existing._id },
                    { $set: { password: hashedPassword, role: 'staff', name: s.name, updatedAt: new Date() } }
                );
                console.log(`Updated staff user: ${s.email}`);
            } else {
                await db.collection('users').insertOne({
                    name: s.name,
                    email: s.email,
                    password: hashedPassword,
                    role: 'staff',
                    phone: '01700000000',
                    address: 'Dhaka, Bangladesh',
                    isPremium: false,
                    isBlocked: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log(`Created new staff user: ${s.email}`);
            }
        }
        console.log("Staff accounts successfully seeded/updated!");
    } catch (err) {
        console.error("Error seeding staff accounts:", err);
    } finally {
        await client.close();
    }
}

seedRequestedStaff();
