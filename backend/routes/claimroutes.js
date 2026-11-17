const express = require("express");
const router = express.Router();

const Claim = require("../models/claim");
const Item = require("../models/item");
const authMiddleware = require("../middleware/auth");

// Submit a claim
router.post("/:itemId", authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Please enter a claim message"
            });
        }

        const item = await Item.findById(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        if (item.status !== "Open") {
            return res.status(400).json({
                success: false,
                message: "This item is not available for claiming"
            });
        }

    const existingClaim = await Claim.findOne({
    item: item._id,
    claimant: req.user.id
});

if (existingClaim) {
    return res.status(400).json({
        success: false,
        message: "You have already submitted a claim for this item"
    });
}

        const claim = new Claim({
            item: item._id,
            claimant: req.user.id,
            message: message
        });

        await claim.save();

        res.status(201).json({
            success: true,
            message: "Claim submitted successfully!",
            data: claim
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// View claims submitted by the logged-in student
router.get("/my-claims", authMiddleware, async (req, res) => {
    try {
        const claims = await Claim.find({
            claimant: req.user.id
        }).populate("item");

        res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Admin approves or rejects a claim
router.put("/:claimId/status", authMiddleware, async (req, res) => {
    try {
        console.log("ALL CLAIMS ROLE:", req.user.role);
        console.log("User role in claim route:", req.user.role);
        console.log(
    "APPROVAL CHECK:",
    JSON.stringify(req.user.role),
    req.user.role === "admin"
);

        if (req.user.role.toLowerCase()!== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can review claims"
            });
        }

        const { status } = req.body;

        if (!["Approved", "Rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be Approved or Rejected"
            });
        }

        const claim = await Claim.findById(req.params.claimId);

        if (!claim) {
            return res.status(404).json({
                success: false,
                message: "Claim not found"
            });
        }

        claim.status = status;
        await claim.save();

        if (status === "Approved") {
            await Item.findByIdAndUpdate(claim.item, {
                status: "Claimed"
            });
        }

        res.status(200).json({
            success: true,
            message: `Claim ${status.toLowerCase()} successfully!`,
            data: claim
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Admin views all submitted claims
router.get("/all", authMiddleware, async (req, res) => {
    try {
        console.log("ALL CLAIMS ROLE:", req.user.role);

        if (String(req.user.role).toLowerCase() !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admin can view all claims"
            });
        }

        console.log("ADMIN CHECK PASSED");

        const claims = await Claim.find()
            .populate("item")
            .populate("claimant", "name email");

        res.status(200).json({
            success: true,
            count: claims.length,
            data: claims
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;
