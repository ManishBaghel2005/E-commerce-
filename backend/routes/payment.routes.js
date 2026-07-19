import express from "express";
import { createOrder, verifyPayment, testConnection } from "../controllers/payment.controllers.js";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/test-connect", testConnection);

export default router;