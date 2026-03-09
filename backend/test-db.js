require("dotenv").config();
const mongoose = require("mongoose");

async function test() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI.split('@')[1]); // Log host part for safety
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Successfully connected to MongoDB");
        process.exit(0);
    } catch (err) {
        console.error("Connection failed:", err);
        process.exit(1);
    }
}

test();
