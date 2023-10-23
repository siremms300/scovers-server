import express from "express";
import formidable from "express-formidable";

const router = express.Router();

import {
    prices, 
    createSubscription,
    subscriptionStatus,
    subscriptions,
    customerPortal,
    buyEbook,
    ebook, 
    plans,
    paystackSubscription
} from "../controllers/subs"; 

import { requireSignin } from "../middlewares";
 
 


 


// Subscription courses 
router.get("/prices", prices); 
router.get("/ebook", ebook); 
router.post("/create-subscription", requireSignin, createSubscription);
router.get("/subscription-status", requireSignin, subscriptionStatus);
router.get("/subscriptions", requireSignin, subscriptions);
router.get("/customer-portal", requireSignin, customerPortal);




// Purchasing eBooks
router.post("/buy-ebook", requireSignin, buyEbook); 


// PAYSTACK SUBSCRIPTION 
router.get("/plans", plans) 
router.post("/paystack-subscription", requireSignin, paystackSubscription);

module.exports = router; 