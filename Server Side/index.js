import dotenv from 'dotenv';
dotenv.config(); // ✅ Must be FIRST before any process.env access

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { processReportAI } from './services/aiProcessingPipeline.js';

// Firebase Admin Setup — NO top-level await (crashes Vercel serverless)
let firebaseInitialized = false;

if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
        let serviceAccount;

        if (serviceAccountKey) {
            // Production: read from env var (Vercel)
            serviceAccount = JSON.parse(serviceAccountKey);
        } else {
            // Local dev: read from JSON file synchronously (no await needed)
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const jsonPath = path.join(__dirname, 'public-infrastrure-system-firebase-adminsdk.json');
            if (fs.existsSync(jsonPath)) {
                serviceAccount = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }
        }

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            firebaseInitialized = true;
            console.log('✅ Firebase Admin initialized');
        } else {
            console.warn('⚠️ Firebase: no credentials found. Set FIREBASE_SERVICE_ACCOUNT env var.');
        }
    } catch (error) {
        console.error('❌ Firebase init error:', error.message);
    }
} else {
    firebaseInitialized = true;
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure database is connected for incoming requests (crucial for serverless environments)
app.use(async (req, res, next) => {
    if (!dbConnected && process.env.MONGODB_URI) {
        try {
            await connectToDatabase();
        } catch (error) {
            console.error("Database connection middleware error:", error);
        }
    }
    next();
});

// MongoDB Connection
const uri = process.env.MONGODB_URI;
let client;
let db;
let dbConnected = false;
let dbPromise = null;

async function connectToDatabase() {
    if (dbConnected) return db;
    if (dbPromise) return dbPromise;

    if (!uri) {
        console.warn("⚠️ MONGODB_URI environment variable is not defined. Skipping connection.");
        return;
    }

    dbPromise = (async () => {
        try {
            if (!client) {
                client = new MongoClient(uri, {
                    serverApi: {
                        version: ServerApiVersion.v1,
                        strict: true,
                        deprecationErrors: true,
                    }
                });
            }

            // Connect the client to the server
            await client.connect();
            db = client.db('infrastructure_reporting');
            dbConnected = true;
            console.log("✅ Successfully connected to MongoDB!");

            // Create indexes for better performance
            try {
                await db.collection('users').createIndex({ email: 1 }, { unique: true });
                await db.collection('issues').createIndex({ status: 1 });
                await db.collection('issues').createIndex({ citizenId: 1 });
                await seedUsers();
            } catch (setupError) {
                console.error("Warning: Error creating indexes or seeding:", setupError.message);
            }

            return db;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            dbConnected = false;
            dbPromise = null; // Reset promise on failure
            
            // Only retry with setTimeout if not running on Vercel
            if (process.env.VERCEL !== '1') {
                console.log("Retrying connection in 5 seconds...");
                setTimeout(connectToDatabase, 5000);
            }
            throw error;
        }
    })();

    return dbPromise;
}

const seedUsers = async () => {
    try {
        const staffPassword = await bcrypt.hash('staff123', 10);
        await db.collection('users').updateOne(
            { email: 'staff@gmail.com' },
            {
                $set: {
                    name: 'Default Staff',
                    email: 'staff@gmail.com',
                    password: staffPassword,
                    role: 'staff',
                    createdAt: new Date(),
                    isBlocked: false
                }
            },
            { upsert: true }
        );
        console.log("✅ Seeded Staff User: staff@gmail.com");

        const citizenPassword = await bcrypt.hash('citizen123', 10);
        await db.collection('users').updateOne(
            { email: 'citizen@gmail.com' },
            {
                $set: {
                    name: 'Default Citizen',
                    email: 'citizen@gmail.com',
                    password: citizenPassword,
                    role: 'citizen',
                    createdAt: new Date(),
                    isBlocked: false
                }
            },
            { upsert: true }
        );
        console.log("✅ Seeded Citizen User: citizen@gmail.com");

        const adminPassword = await bcrypt.hash('sonaton123', 10);
        await db.collection('users').updateOne(
            { email: 'sonaton.fl@gmail.com' },
            {
                $set: {
                    name: 'Sonaton Admin',
                    email: 'sonaton.fl@gmail.com',
                    password: adminPassword,
                    role: 'admin',
                    createdAt: new Date(),
                    isBlocked: false
                }
            },
            { upsert: true }
        );
        console.log("✅ Seeded Admin User: sonaton.fl@gmail.com");

    } catch (error) {
        console.error("Error seeding users:", error);
    }
};

if (process.env.MONGODB_URI) {
    connectToDatabase().catch(err => console.error("Initial DB connection failed:", err));
} else {
    console.warn("⚠️ MONGODB_URI is not defined. Initial database connection skipped.");
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// ============ AUTHENTICATION ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { name, email, password, phone, address, isPremium = false, photo } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const newUser = {
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            address: address || '',
            role: 'citizen', // Enforce citizen role for public registration
            isPremium: isPremium,
            isBlocked: false,
            photo: photo || null, // Store photo URL/Base64
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: result.insertedId.toString(),
                email: newUser.email,
                role: newUser.role,
                isPremium: newUser.isPremium
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertedId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isPremium: newUser.isPremium
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const cleanEmail = (email || '').trim().toLowerCase();

        // Find user (case-insensitive email lookup)
        const user = await db.collection('users').findOne({
            email: { $regex: `^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'Invalid email or password. Password not set for this account.' });
        }

        // Check password safely
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                isPremium: user.isPremium || false
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                role: user.role,
                isPremium: user.isPremium || false,
                isBlocked: user.isBlocked || false,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'Token required' });

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email, name, picture, uid } = decodedToken;

        let user = await db.collection('users').findOne({ email });

        if (!user) {
            // Register new citizen
            const newUser = {
                name: name || 'Google User',
                email,
                password: '', // No password for Google users
                role: 'citizen',
                isPremium: false,
                isBlocked: false,
                photo: picture || null,
                googleId: uid,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const result = await db.collection('users').insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
        } else {
            // Update googleId if missing
            if (!user.googleId) {
                await db.collection('users').updateOne({ _id: user._id }, { $set: { googleId: uid, photo: picture || user.photo } });
            }
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Account is blocked' });
        }

        const jwtToken = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                isPremium: user.isPremium
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isPremium: user.isPremium
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update current user profile
app.patch('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { name, phone, address } = req.body;
        const updateFields = { updatedAt: new Date() };

        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.userId) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ ISSUE ROUTES ============

// Create new issue (Citizens only)
app.post('/api/issues', authenticateToken, authorizeRole('citizen'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { title, description, category, location, photos } = req.body;

        // Check if user is blocked or has reached limit
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });

        if (user?.isBlocked) {
            return res.status(403).json({ message: 'Your account is blocked. You cannot submit issues.' });
        }

        // Check limit for free users
        if (!user?.isPremium && user?.role === 'citizen') {
            const issueCount = await db.collection('issues').countDocuments({ citizenId: new ObjectId(req.user.userId) });
            if (issueCount >= 3) {
                return res.status(403).json({
                    message: 'Free users can only report 3 issues. Please upgrade to Premium for unlimited reporting.',
                    requiresUpgrade: true
                });
            }
        }

        // Make category optional for submission
        if (!title || !description || !location) {
            return res.status(400).json({ message: 'Title, description, and location are required' });
        }

        const newIssue = {
            title,
            description,
            category: category || 'other', // fallback if citizen didn't provide one
            citizenSelectedCategory: category || null, // new field to track manual selection
            location: {
                address: location.address || '',
                latitude: location.latitude || 0,
                longitude: location.longitude || 0
            },
            photos: photos || [],
            citizenId: new ObjectId(req.user.userId),
            citizenName: '', // Will be populated
            citizenEmail: req.user.email,
            isPremiumIssue: req.user.isPremium || false,
            status: 'pending', // pending, assigned, in-progress, resolved, closed
            assignedTo: null,
            assignedStaffName: null,
            priority: req.user.isPremium ? 'high' : 'normal', // high, normal, low
            comments: [],
            statusHistory: [
                {
                    status: 'pending',
                    updatedBy: req.user.email,
                    updatedByRole: 'citizen',
                    timestamp: new Date(),
                    comment: req.user.isPremium ? 'Priority Issue reported by Premium Citizen' : 'Issue reported by citizen'
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date(),

            // New AI fields initialized as pending/empty
            originalText: `${title} ${description}`,
            detectedLanguage: '',
            aiCategory: '',
            aiCategoryConfidence: 0,
            aiSummaryEn: '',
            severityScore: 5,
            severityLabel: 'Medium',
            severityReason: 'AI analysis pending',
            isIncomplete: false,
            missingInfoNote: '',
            duplicateOf: null,
            duplicateConfidence: null,
            duplicateStatus: 'none',
            aiProcessedAt: null,
            aiProcessingStatus: 'processing' // starts in processing state
        };

        // Get citizen name
        const citizen = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
        if (citizen) {
            newIssue.citizenName = citizen.name;
        }

        const result = await db.collection('issues').insertOne(newIssue);

        // Trigger background AI processing pipeline asynchronously (fire-and-forget)
        processReportAI(
            result.insertedId.toString(),
            title,
            description,
            location.address || '',
            photos && photos.length > 0 ? photos[0] : null,
            category || null,
            db
        );

        res.status(201).json({
            message: 'Issue reported successfully',
            issue: { ...newIssue, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Issue creation error:', error);
        res.status(500).json({ message: 'Server error while creating issue' });
    }
});

// Get AI processing status of a report (for polling)
app.get('/api/issues/:id/status', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const issue = await db.collection('issues').findOne(
            { _id: new ObjectId(req.params.id) },
            { projection: { aiProcessingStatus: 1, category: 1, duplicateStatus: 1, duplicateOf: 1 } }
        );

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({
            aiProcessingStatus: issue.aiProcessingStatus || 'pending',
            category: issue.category,
            duplicateStatus: issue.duplicateStatus || 'none',
            duplicateOf: issue.duplicateOf || null
        });
    } catch (error) {
        console.error('Error fetching issue status:', error);
        res.status(500).json({ message: 'Server error while checking status' });
    }
});

// Alias routes for /api/reports compatibility
app.post('/api/reports', authenticateToken, authorizeRole('citizen'), (req, res, next) => {
    req.url = '/api/issues';
    app.handle(req, res, next);
});

app.get('/api/reports/:id/status', authenticateToken, (req, res, next) => {
    req.url = `/api/issues/${req.params.id}/status`;
    app.handle(req, res, next);
});


// Get all issues (with filtering)
app.get('/api/issues', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { status, category, priority, citizenId, search, page = 1, limit = 10 } = req.query;
        const filter = {};

        // Apply filters
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (citizenId) {
            filter.citizenId = new ObjectId(citizenId);
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { 'location.address': { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalIssues = await db.collection('issues').countDocuments(filter);
        const totalPages = Math.ceil(totalIssues / limitNum);

        const issues = await db.collection('issues')
            .find(filter)
            .sort({ isPremiumIssue: -1, upvotes: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        res.json({
            issues,
            pagination: {
                totalIssues,
                totalPages,
                currentPage: pageNum,
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Issue fetch error:', error);
        res.status(500).json({ message: 'Server error while fetching issues' });
    }
});

// ============ MAP API ROUTES (PHASE 2) ============

// GET /api/map/districts - Aggregated statistics per district for Live Map
app.get('/api/map/districts', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { category, severity, status, duplicateStatus } = req.query;

        // Build $match stage
        const matchStage = {
            district: { $ne: null, $exists: true, $ne: '' }
        };

        if (category) {
            matchStage.$or = [
                { aiCategory: { $regex: category, $options: 'i' } },
                { category: { $regex: category, $options: 'i' } }
            ];
        }

        if (severity) {
            if (severity.toLowerCase() === 'critical_high') {
                matchStage.severityLabel = { $in: ['Critical', 'High'] };
            } else {
                matchStage.severityLabel = { $regex: severity, $options: 'i' };
            }
        }

        if (status) {
            if (status.toLowerCase() === 'open') {
                matchStage.status = { $in: ['pending', 'assigned', 'in-progress'] };
            } else {
                matchStage.status = status.toLowerCase();
            }
        }

        if (duplicateStatus) {
            if (duplicateStatus === 'duplicate' || duplicateStatus === 'possible_duplicate') {
                matchStage.duplicateStatus = { $in: ['possible_duplicate', 'confirmed_duplicate'] };
            } else if (duplicateStatus === 'none') {
                matchStage.duplicateStatus = { $in: ['none', null] };
            }
        }

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$district',
                    totalIssues: { $sum: 1 },
                    avgSeverityScoreRaw: { $avg: { $ifNull: ['$severityScore', 1] } },

                    // Categories breakdown
                    potholeCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiCategory', ['Pothole']] }, 1, 0
                            ]
                        }
                    },
                    waterLeakCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiCategory', ['Water Leak']] }, 1, 0
                            ]
                        }
                    },
                    illegalDumpingCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiCategory', ['Illegal Dumping']] }, 1, 0
                            ]
                        }
                    },
                    brokenStreetlightCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiCategory', ['Broken Streetlight']] }, 1, 0
                            ]
                        }
                    },
                    damagedFootpathCount: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiCategory', ['Damaged Footpath']] }, 1, 0
                            ]
                        }
                    },
                    otherCategoryCount: {
                        $sum: {
                            $cond: [
                                { $or: [{ $eq: ['$aiCategory', 'Other'] }, { $eq: [{ $ifNull: ['$aiCategory', ''] }, ''] }] }, 1, 0
                            ]
                        }
                    },

                    // Severity breakdown
                    criticalCount: {
                        $sum: { $cond: [{ $eq: ['$severityLabel', 'Critical'] }, 1, 0] }
                    },
                    highCount: {
                        $sum: { $cond: [{ $eq: ['$severityLabel', 'High'] }, 1, 0] }
                    },
                    mediumCount: {
                        $sum: { $cond: [{ $eq: ['$severityLabel', 'Medium'] }, 1, 0] }
                    },
                    lowCount: {
                        $sum: {
                            $cond: [
                                { $or: [{ $eq: ['$severityLabel', 'Low'] }, { $eq: [{ $ifNull: ['$severityLabel', ''] }, ''] }] }, 1, 0
                            ]
                        }
                    },

                    // Status breakdown
                    openIssues: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['pending', 'assigned', 'in-progress']] }, 1, 0
                            ]
                        }
                    },
                    resolvedIssues: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['resolved', 'closed']] }, 1, 0
                            ]
                        }
                    }
                }
            },
            { $sort: { totalIssues: -1 } }
        ];

        const aggregatedDistricts = await db.collection('issues').aggregate(pipeline).toArray();

        const formattedResult = aggregatedDistricts.map(item => ({
            district: item._id,
            totalIssues: item.totalIssues,
            byCategory: {
                "Pothole": item.potholeCount,
                "Water Leak": item.waterLeakCount,
                "Illegal Dumping": item.illegalDumpingCount,
                "Broken Streetlight": item.brokenStreetlightCount,
                "Damaged Footpath": item.damagedFootpathCount,
                "Other": item.otherCategoryCount
            },
            bySeverity: {
                "Critical": item.criticalCount,
                "High": item.highCount,
                "Medium": item.mediumCount,
                "Low": item.lowCount
            },
            avgSeverityScore: Number((item.avgSeverityScoreRaw || 1).toFixed(1)),
            openIssues: item.openIssues,
            resolvedIssues: item.resolvedIssues
        }));

        res.json(formattedResult);
    } catch (error) {
        console.error('Error fetching map districts aggregation:', error);
        res.status(500).json({ message: 'Server error fetching map districts data' });
    }
});

// GET /api/map/pins - Individual report pins for interactive map
app.get('/api/map/pins', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { district, category, severity, status, duplicateStatus } = req.query;

        const query = {
            latitude: { $ne: null, $exists: true, $ne: 0 },
            longitude: { $ne: null, $exists: true, $ne: 0 }
        };

        if (district) {
            query.district = { $regex: district, $options: 'i' };
        }

        if (category) {
            query.$or = [
                { aiCategory: { $regex: category, $options: 'i' } },
                { category: { $regex: category, $options: 'i' } }
            ];
        }

        if (severity) {
            if (severity.toLowerCase() === 'critical_high') {
                query.severityLabel = { $in: ['Critical', 'High'] };
            } else {
                query.severityLabel = { $regex: severity, $options: 'i' };
            }
        }

        if (status) {
            if (status.toLowerCase() === 'open') {
                query.status = { $in: ['pending', 'assigned', 'in-progress'] };
            } else {
                query.status = status.toLowerCase();
            }
        }

        if (duplicateStatus) {
            if (duplicateStatus === 'duplicate' || duplicateStatus === 'possible_duplicate') {
                query.duplicateStatus = { $in: ['possible_duplicate', 'confirmed_duplicate'] };
            } else if (duplicateStatus === 'none') {
                query.duplicateStatus = { $in: ['none', null] };
            }
        }

        // Projection explicitly EXCLUDES sensitive citizen details (privacy rule)
        const pins = await db.collection('issues').find(query, {
            projection: {
                _id: 1,
                title: 1,
                latitude: 1,
                longitude: 1,
                district: 1,
                aiCategory: 1,
                specificIssueLabel: 1,
                severityLabel: 1,
                severityScore: 1,
                status: 1,
                aiSummaryEn: 1,
                duplicateStatus: 1,
                duplicateOf: 1,
                createdAt: 1
            }
        }).sort({ createdAt: -1 }).toArray();

        const formattedPins = pins.map(pin => ({
            id: pin._id.toString(),
            trackingCode: pin._id.toString().substring(0, 8).toUpperCase(),
            title: pin.title || 'Infrastructure Issue',
            latitude: pin.latitude,
            longitude: pin.longitude,
            district: pin.district || 'Unknown',
            aiCategory: pin.aiCategory || 'Other',
            specificIssueLabel: pin.specificIssueLabel || pin.aiCategory || 'Infrastructure Issue',
            severityLabel: pin.severityLabel || 'Low',
            severityScore: pin.severityScore || 1,
            status: pin.status || 'pending',
            duplicateStatus: pin.duplicateStatus || 'none',
            duplicateOf: pin.duplicateOf ? pin.duplicateOf.toString() : null,
            aiSummaryEn: pin.aiSummaryEn || pin.title || '',
            submittedAt: pin.createdAt ? pin.createdAt.toISOString() : new Date().toISOString()
        }));

        res.json(formattedPins);
    } catch (error) {
        console.error('Error fetching map pins:', error);
        res.status(500).json({ message: 'Server error fetching map pins' });
    }
});

// GET /api/reports/track/:trackingCode - PUBLIC report tracking lookup (No Auth Required)
app.get('/api/reports/track/:trackingCode', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const rawCode = (req.params.trackingCode || '').trim();

        if (!rawCode) {
            return res.status(400).json({ message: 'Tracking code is required' });
        }

        const cleanCode = rawCode.toUpperCase();
        let issue = null;

        // 1. Try matching by 24-char ObjectId if valid
        if (ObjectId.isValid(rawCode) && rawCode.length === 24) {
            issue = await db.collection('issues').findOne({ _id: new ObjectId(rawCode) });
        }

        // 2. If not found by 24-char ObjectId, try matching by 8-character prefix of _id
        if (!issue) {
            issue = await db.collection('issues').findOne({
                $expr: {
                    $eq: [
                        { $toUpper: { $substr: [{ $toString: "$_id" }, 0, cleanCode.length] } },
                        cleanCode
                    ]
                }
            });
        }

        if (!issue) {
            return res.status(404).json({
                found: false,
                message: 'No report found with this tracking code — please check the code and try again.'
            });
        }

        // Sanitize status history to remove sensitive citizen email addresses
        const cleanHistory = Array.isArray(issue.statusHistory) ? issue.statusHistory.map(h => ({
            status: h.status || 'updated',
            updatedByRole: h.updatedByRole || 'system',
            timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
            comment: h.comment || `Status updated to ${h.status}`
        })) : [];

        // Return ONLY public-safe fields (Privacy Rule Enforcement)
        const trackingDetails = {
            found: true,
            id: issue._id.toString(),
            trackingCode: issue._id.toString().substring(0, 8).toUpperCase(),
            title: issue.title || 'Infrastructure Report',
            aiCategory: issue.aiCategory || issue.category || 'Other',
            specificIssueLabel: issue.specificIssueLabel || issue.aiCategory || issue.category || 'Infrastructure Issue',
            severityLabel: issue.severityLabel || 'Medium',
            severityScore: issue.severityScore || 5,
            status: issue.status || 'pending',
            assignedStaffName: issue.assignedStaffName || null,
            aiSummaryEn: issue.aiSummaryEn || issue.description || '',
            submittedAt: issue.createdAt ? new Date(issue.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: issue.updatedAt ? new Date(issue.updatedAt).toISOString() : new Date().toISOString(),
            statusHistory: cleanHistory
        };

        res.json(trackingDetails);
    } catch (error) {
        console.error('Error tracking issue by code:', error);
        res.status(500).json({ message: 'Server error processing tracking lookup' });
    }
});

// Get single issue by ID
app.get('/api/issues/:id', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({ issue });
    } catch (error) {
        console.error('Issue fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upvote an issue
app.put('/api/issues/:id/upvote', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        // Check if user is blocked
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
        if (user?.isBlocked) {
            return res.status(403).json({ message: 'Your account is blocked. You cannot upvote.' });
        }

        const issueId = req.params.id;
        const userId = req.user.userId;

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(issueId) });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Users cannot upvote their own issue
        if (issue.citizenId.toString() === userId) {
            return res.status(403).json({ message: 'You cannot upvote your own issue' });
        }

        // Check if already upvoted
        if (issue.upvotedBy && issue.upvotedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already upvoted this issue' });
        }

        const result = await db.collection('issues').updateOne(
            { _id: new ObjectId(issueId) },
            {
                $inc: { upvotes: 1 },
                $push: { upvotedBy: userId },
                $set: { updatedAt: new Date() }
            }
        );

        // Create timeline entry for Boost
        await db.collection('issues').updateOne(
            { _id: new ObjectId(issueId) },
            {
                $push: {
                    statusHistory: {
                        status: 'boosted',
                        updatedBy: req.user.email,
                        updatedByRole: req.user.role,
                        timestamp: new Date(),
                        comment: 'Issue boosted! Priority increased.'
                    }
                }
            }
        );

        res.json({ message: 'Upvoted successfully', upvotes: (issue.upvotes || 0) + 1 });

    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Subscribe / Payment Endpoint (Mock)
app.post('/api/payment/subscribe', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        // In a real app, verify Stripe/Payment gateway here
        // For now, we instantly upgrade the user
        const { amount } = req.body;

        if (amount < 1000) {
            return res.status(400).json({ message: 'Invalid amount. Subscription costs 1000tk.' });
        }

        await db.collection('users').updateOne(
            { _id: new ObjectId(req.user.userId) },
            {
                $set: {
                    isPremium: true,
                    updatedAt: new Date()
                }
            }
        );

        res.json({ message: 'Subscription successful! You are now a Premium user.' });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign issue to staff (Admin only - PATCH)
app.patch('/api/issues/:id/assign', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { staffId, internalNote, note } = req.body;
        const noteText = (internalNote || note || '').trim();

        if (!staffId) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }

        // Get staff details
        const staff = await db.collection('users').findOne({
            _id: new ObjectId(staffId),
            role: 'staff'
        });

        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        const historyComment = noteText
            ? `Assigned to ${staff.name} — Note: "${noteText}"`
            : `Issue assigned to Staff: ${staff.name}`;

        const result = await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    assignedTo: new ObjectId(staffId),
                    assignedStaffName: staff.name,
                    internalNote: noteText,
                    adminNote: noteText,
                    status: 'assigned',
                    updatedAt: new Date()
                },
                $push: {
                    statusHistory: {
                        status: 'assigned',
                        updatedBy: req.user.email,
                        updatedByRole: req.user.role,
                        changedBy: req.user.userId,
                        changedByName: req.user.name,
                        comment: historyComment,
                        timestamp: new Date(),
                        date: new Date()
                    }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({ message: `Issue assigned to ${staff.name} successfully` });
    } catch (error) {
        console.error('Issue assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update issue status (Staff and Admin)
app.patch('/api/issues/:id/status', authenticateToken, authorizeRole('staff', 'admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { status, comment } = req.body;
        const validStatuses = ['pending', 'assigned', 'in-progress', 'working', 'resolved', 'closed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Staff can only update issues assigned to them
        if (req.user.role === 'staff' && (!issue.assignedTo || issue.assignedTo.toString() !== req.user.userId)) {
            return res.status(403).json({ message: 'You can only update issues assigned to you' });
        }

        // If status is changing to 'rejected', ensure it was pending
        if (status === 'rejected' && issue.status !== 'pending') {
            return res.status(400).json({ message: 'Can only reject pending issues' });
        }

        const updateDoc = {
            $set: { status, updatedAt: new Date() },
            $push: {
                statusHistory: {
                    status,
                    changedBy: req.user.userId,
                    changedByName: req.user.name, // Ideally fetch name
                    comment: comment || `Status updated to ${status}`,
                    date: new Date()
                }
            }
        };

        await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            updateDoc
        );

        res.json({ message: 'Issue status updated' });
    } catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign Staff to Issue (PUT)
app.put('/api/issues/:id/assign', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ message: 'Database not connected' });

        const { staffId, internalNote, note } = req.body;
        const noteText = (internalNote || note || '').trim();

        if (!staffId) return res.status(400).json({ message: 'Staff ID is required' });

        const staff = await db.collection('users').findOne({ _id: new ObjectId(staffId), role: 'staff' });
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        const historyComment = noteText
            ? `Assigned to ${staff.name} — Note: "${noteText}"`
            : `Assigned to staff: ${staff.name}`;

        const updateDoc = {
            $set: {
                assignedTo: staffId.toString(),
                assignedStaffName: staff.name,
                internalNote: noteText,
                adminNote: noteText,
                status: 'assigned', // Workflow: Pending -> Assigned -> In Progress
                updatedAt: new Date()
            },
            $push: {
                statusHistory: {
                    status: 'assigned',
                    changedBy: req.user.userId,
                    changedByName: req.user.name,
                    updatedBy: req.user.email,
                    updatedByRole: req.user.role,
                    comment: historyComment,
                    timestamp: new Date(),
                    date: new Date()
                }
            }
        };

        await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            updateDoc
        );

        res.json({ message: `Issue assigned to ${staff.name}` });
    } catch (error) {
        console.error('Assign issue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject Issue
app.put('/api/issues/:id/reject', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ message: 'Database not connected' });

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });
        if (!issue) return res.status(404).json({ message: 'Issue not found' });

        if (issue.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending issues can be rejected' });
        }

        const updateDoc = {
            $set: { status: 'rejected', updatedAt: new Date() },
            $push: {
                statusHistory: {
                    status: 'rejected',
                    changedBy: req.user.userId,
                    changedByName: req.user.name,
                    comment: 'Issue rejected by admin',
                    date: new Date()
                }
            }
        };

        await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            updateDoc
        );

        res.json({ message: 'Issue rejected successfully' });
    } catch (error) {
        console.error('Reject issue error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to issue
app.post('/api/issues/:id/comments', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'Comment is required' });
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });

        const newComment = {
            text: comment,
            authorId: new ObjectId(req.user.userId),
            authorName: user?.name || 'Unknown',
            authorRole: req.user.role,
            timestamp: new Date()
        };

        const result = await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $push: { comments: newComment },
                $set: { updatedAt: new Date() }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// Update issue details (Citizen only, if pending)
app.put('/api/issues/:id', authenticateToken, authorizeRole('citizen'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { title, description, category, location, photos } = req.body;

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Check if user is blocked
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
        if (user?.isBlocked) {
            return res.status(403).json({ message: 'Your account is blocked. You cannot edit issues.' });
        }

        // Verify ownership
        if (issue.citizenId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only edit your own issues' });
        }

        // Verify status
        if (issue.status !== 'pending') {
            return res.status(400).json({ message: 'You can only edit pending issues' });
        }

        const updateFields = {
            updatedAt: new Date()
        };

        if (title) updateFields.title = title;
        if (description) updateFields.description = description;
        if (category) updateFields.category = category;
        if (location) updateFields.location = location;
        if (photos) updateFields.photos = photos;

        await db.collection('issues').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateFields }
        );

        res.json({ message: 'Issue updated successfully' });
    } catch (error) {
        console.error('Issue update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete issue
app.delete('/api/issues/:id', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const issue = await db.collection('issues').findOne({ _id: new ObjectId(req.params.id) });

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Check permissions
        const isAdmin = req.user.role === 'admin';
        const isOwner = issue.citizenId.toString() === req.user.userId;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if blocked (for Citizen owner)
        if (isOwner && !isAdmin) {
            const currentUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
            if (currentUser?.isBlocked) {
                return res.status(403).json({ message: 'Your account is blocked.' });
            }
        }

        // Citizens can only delete pending issues
        if (isOwner && !isAdmin && issue.status !== 'pending') {
            return res.status(400).json({ message: 'You can only delete pending issues' });
        }

        const result = await db.collection('issues').deleteOne({ _id: new ObjectId(req.params.id) });

        res.json({ message: 'Issue deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ USER MANAGEMENT ROUTES (Admin only) ============

// Get all users
app.get('/api/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { role } = req.query;
        const filter = {};

        if (role) filter.role = role;

        const users = await db.collection('users')
            .find(filter, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ users });
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new staff member (Admin only)
app.post('/api/staff', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ message: 'Database not connected' });

        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Check if user with this email already exists in MongoDB
        const existingUser = await db.collection('users').findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Hash password for JWT login verification
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create user in Firebase Authentication (if configured)
        let firebaseUid = null;
        try {
            if (admin && admin.auth) {
                const firebaseUser = await admin.auth().createUser({
                    email: cleanEmail,
                    password,
                    displayName: name,
                });
                firebaseUid = firebaseUser.uid;
            }
        } catch (firebaseError) {
            console.warn('Firebase user creation note:', firebaseError.message);
        }

        // 2. Create user in MongoDB with hashed password
        const newUser = {
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword, // Hashed password stored for JWT auth login
            role: 'staff', // Enforce staff role
            phone: phone || '',
            address: address || '',
            firebaseUid: firebaseUid,
            isPremium: false,
            isBlocked: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        res.status(201).json({ message: 'Staff member created successfully', userId: result.insertedId });
    } catch (error) {
        console.error('Create staff error:', error);
        res.status(500).json({ message: 'Server error creating staff: ' + (error.message || 'Unknown error') });
    }
});

// Update user role, premium status, or blocked status (Admin only)
app.patch('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { role, isPremium, isBlocked } = req.body;
        const updateFields = { updatedAt: new Date() };

        if (role) updateFields.role = role;
        if (isPremium !== undefined) updateFields.isPremium = isPremium;
        if (isBlocked !== undefined) updateFields.isBlocked = isBlocked;

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Block/Unblock user (Admin only)
app.patch('/api/users/:id/block', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { isBlocked } = req.body;

        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({ message: 'isBlocked must be a boolean' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isBlocked: isBlocked, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        console.error('Block/unblock user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) return res.status(503).json({ message: 'Database not connected' });

        const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ DASHBOARD STATS ============

// Get dashboard statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const filter = {};
        if (req.user.role === 'citizen') {
            filter.citizenId = new ObjectId(req.user.userId);
        }

        const totalIssues = await db.collection('issues').countDocuments(filter);
        const pendingIssues = await db.collection('issues').countDocuments({ ...filter, status: 'pending' });
        const inProgressIssues = await db.collection('issues').countDocuments({ ...filter, status: 'in-progress' });
        const resolvedIssues = await db.collection('issues').countDocuments({ ...filter, status: 'resolved' });
        const closedIssues = await db.collection('issues').countDocuments({ ...filter, status: 'closed' });

        let stats = {
            issues: {
                total: totalIssues,
                pending: pendingIssues,
                inProgress: inProgressIssues,
                resolved: resolvedIssues,
                closed: closedIssues
            },
            totalPayments: req.user.isPremium ? 1000 : 0
        };

        if (req.user.role === 'staff') {
            // Staff sees stats for their assigned issues
            const staffId = req.user.userId;
            const totalAssigned = await db.collection('issues').countDocuments({ assignedTo: staffId });
            const workingIssues = await db.collection('issues').countDocuments({ assignedTo: staffId, status: 'working' });
            const inProgressIssues = await db.collection('issues').countDocuments({ assignedTo: staffId, status: 'in-progress' });
            const resolvedIssues = await db.collection('issues').countDocuments({ assignedTo: staffId, status: 'resolved' });

            // Today's tasks (updated or assigned today)
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const todaysTasks = await db.collection('issues').countDocuments({
                assignedTo: staffId,
                updatedAt: { $gte: startOfDay }
            });

            stats.issues = {
                total: totalAssigned,
                working: workingIssues,
                inProgress: inProgressIssues,
                resolved: resolvedIssues,
                today: todaysTasks
            };
        } else if (req.user.role === 'admin') {
            const totalUsers = await db.collection('users').countDocuments();
            const premiumUsers = await db.collection('users').countDocuments({ isPremium: true });
            const staffCount = await db.collection('users').countDocuments({ role: 'staff' });

            // Rejected
            const rejectedIssues = await db.collection('issues').countDocuments({ status: 'rejected' });

            // Total Payments (Sum of subscriptions) - simplistic
            // In real app, aggregate payments collection. Here we count premium users * 1000
            const totalRevenue = premiumUsers * 1000;

            // Issue breakdown
            const categoryStats = await db.collection('issues').aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]).toArray();

            stats.issues.rejected = rejectedIssues;
            stats.users = {
                total: totalUsers,
                premium: premiumUsers,
                staff: staffCount
            };
            stats.revenue = totalRevenue;
            stats.categoryBreakdown = categoryStats;
        }

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get payments (Admin only)
app.get('/api/payments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        // Mock payment data since we don't have a real payment gateway integrated yet
        // In a real app, this would query a 'payments' collection
        const payments = [
            { id: 1, user: 'John Doe', amount: 50, type: 'Subscription', date: new Date(), status: 'Completed' },
            { id: 2, user: 'Jane Smith', amount: 10, type: 'Boost', date: new Date(Date.now() - 86400000), status: 'Completed' },
        ];

        res.json({ payments });
    } catch (error) {
        console.error('Payments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Contact Form Submission
app.post('/api/contact', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({ message: 'Database not connected' });
        }

        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required' });
        }

        const newMessage = {
            name,
            email,
            subject,
            message,
            status: 'unread',
            createdAt: new Date()
        };

        await db.collection('messages').insertOne(newMessage);

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: dbConnected ? 'Connected' : 'Disconnected',
        timestamp: new Date()
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Public Infrastructure Issue Reporting System API',
        version: '1.0.0',
        status: 'Running'
    });
});

// Start server
// Start server only if not running on Vercel
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API: http://localhost:${PORT}`);
    });
}

export default app;

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (client) {
        await client.close();
    }
    process.exit(0);
});
