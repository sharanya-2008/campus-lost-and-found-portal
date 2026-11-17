const express = require("express");
const router = express.Router();

const Item = require("../models/item.js");
const authMiddleware = require("../middleware/auth");

// 1. Add a new lost or found item
router.post("/", authMiddleware, async (req, res) => {
    try {
        const newItem = new Item({
            ...req.body,
            reportedBy: req.user.id
        });

        const savedItem = await newItem.save();

        res.status(201).json({
            success: true,
            message: "Item added successfully!",
            data: savedItem
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 2. Get all items
router.get("/", async (req, res) => {
    try {
        const items = await Item.find();

        res.status(200).json({
            success: true,
            data: items
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

 // Search items by name
router.get("/search", async (req, res) => {
    try {
        const name = req.query.name;

        const items = await Item.find({
            itemName: { $regex: name, $options: "i" }
        });

        res.status(200).json({
            success: true,
            data: items
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Filter items by type and category
router.get("/filter", async (req, res) => {
    try {
        const { type, category } = req.query;

        const filter = {};

        if (type) {
            filter.type = type;
        }

        if (category) {
            filter.category = category;
        }

        const items = await Item.find(filter);

        res.status(200).json({
            success: true,
            data: items
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});
// Get items reported by the logged-in student
router.get("/my-items", authMiddleware, async (req, res) => {
    try {
        const items = await Item.find({
            reportedBy: req.user.id
        });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 3. Get one item by ID
router.get("/:id", async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/// 4. Delete an item (Admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {

        // Check admin permission
        if (String(req.user.role).toLowerCase() !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can delete items"
            });
        }

        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Item deleted successfully!"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Update an item by ID
router.put("/:id", async (req, res) => {
    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Item updated successfully!",
            data: updatedItem
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
