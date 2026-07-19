import Lead from '../models/lead.models.js';

export const createLead = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Validation checking
        if (!name || !email || !phone || !address) {
            return res.status(400).json({ error: "Sabhi fields fill karna zaroori hai!" });
        }
        // Phone Number Validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: "Invalid Indian phone number! Exactly 10 digits required starting with 6-9." });
    }

        // Email format check (optional but good practice)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Valid email address enter karein!" });
        }

        const newLead = new Lead({ name, email, phone, address });
        await newLead.save();

        res.status(201).json({ success: true, message: "Lead successfully saved!" });
    } catch (error) {
        console.error("Lead submission error:", error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};


// 2. Admin Panel par saari Leads show karne ke liye
export const getAllLeads = async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 }); // Latest leads pehle aayengi
        res.status(200).json({ 
            success: true, 
            data: leads 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};