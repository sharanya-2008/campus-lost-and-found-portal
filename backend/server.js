const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const itemRoutes = require("./routes/itemroutes");
const authRoutes = require("./routes/authroutes");
const claimRoutes = require("./routes/claimroutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect Item Routes
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/claims", claimRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Campus Lost and Found API is running!");
});

// Test route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Backend is working successfully!"
    });
});

// Start server after database connection
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();

