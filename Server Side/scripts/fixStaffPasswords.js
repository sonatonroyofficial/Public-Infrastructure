import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function fixStaffPasswords() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('infrastructure_reporting');
        const users = await db.collection('users').find({ role: 'staff' }).toArray();
        console.log(`Found ${users.length} staff members:`, users.map(u => ({ email: u.email, hasPassword: !!u.password })));

        for (const user of users) {
            let passToSet = 'staff123';
            if (user.email === 'water@gmail.com') passToSet = 'staff123';
            if (user.email === 'hackkings090@gmail.com') passToSet = 'staff123';

            const hashedPassword = await bcrypt.hash(passToSet, 10);
            await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { password: hashedPassword } }
            );
            console.log(`Updated password for staff: ${user.email} -> password set to: ${passToSet}`);
        }
        console.log("All staff passwords fixed!");
    } catch (err) {
        console.error("Error fixing staff passwords:", err);
    } finally {
        await client.close();
    }
}

fixStaffPasswords();
