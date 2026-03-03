const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
// Accept URL-encoded bodies (for form submissions) as well
app.use(express.urlencoded({ extended: true }));

// JSON parse error handler (gives a friendly message instead of HTML stack)
app.use((err, req, res, next) => {
    if (err && err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON received:', err.message);
        return res.status(400).json({ msg: 'Invalid JSON payload' });
    }
    return next(err);
});

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://67011690_db_user:JdrzjbCt0IFWMMLP@cluster0.xkfbjyj.mongodb.net/?appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

connectDB();

// Test route
app.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

// Simple route for root
app.get('/', (req, res) => {
    res.json({ 
        message: 'Mediqueue API Server',
        endpoints: {
            test: '/test',
            patients: '/api/patients'
        }
    });
});

// We'll add routes later - commented out for now
const patientRoutes = require('./routes/PatientRoute');
app.use('/api/patients', patientRoutes);

const doctorRoutes = require('./routes/DoctorRoute');
app.use('/api/doctors', doctorRoutes);



const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5001;

// Unified login endpoint
const Doctor = require('./models/Doctor');
const Patient = require('./models/patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: 'Email and password required' });
        }
        let userType, user, payload;
        if (email.endsWith('@doctor.com')) {
            userType = 'doctor';
            user = await Doctor.findOne({ email });
            if (!user) return res.status(400).json({ msg: 'Invalid doctor credentials' });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: 'Invalid doctor credentials' });
            payload = { doctor: { id: user.id, name: user.name, specialization: user.specialization } };
        } else {
            userType = 'patient';
            user = await Patient.findOne({ email });
            if (!user) return res.status(400).json({ msg: 'Invalid patient credentials' });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: 'Invalid patient credentials' });
            payload = { patient: { id: user.id, name: user.name, email: user.email } };
        }
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, userType, user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Start server and automatically try next port if the desired one is in use
const startServer = (port, attempts = 0) => {
    const server = app.listen(port)
        .on('listening', () => {
            console.log(`✅ Server is running on port ${port}`);
            console.log(`📍 Test the server at: http://localhost:${port}/test`);
        })
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE' && attempts < 5) {
                console.warn(`Port ${port} in use, trying port ${port + 1}...`);
                startServer(port + 1, attempts + 1);
            } else {
                console.error('Server failed to start:', err.message);
                process.exit(1);
            }
        });
};

startServer(DEFAULT_PORT);