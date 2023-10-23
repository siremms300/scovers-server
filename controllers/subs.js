
import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import Course from "../models/course";
import Completed from "../models/completed";
import slugify from "slugify";
import { readFileSync } from "fs";
import User from "../models/user";
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const paystack = require("paystack")(process.env.PAYSTACK_SECRET);




export const prices = async(req, res)=> {

    try{ 
  
      const prices = await stripe.prices.list() 
      console.log("prices ", prices)
      res.json(prices.data.reverse())
  
    } catch(err) {
      console.log(err)
    }
}



export const createSubscription = async (req, res) => {
  // console.log(req.body);
  try {
    const user = await User.findById(req.user._id); 

    const couponId = `EAGLE20_${Date.now()}`; // Generate a unique coupon ID

    const coupon = await stripe.coupons.create({
      duration: 'repeating',
      id: couponId,
      percent_off: 20,
      duration_in_months: 1
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1, 
        },
      ], 
      discounts: [{
        coupon: couponId,
      }],
      customer: user.stripe_customer_id,
      success_url: process.env.STRIPE_SUCCESS_SUB_URL,
      cancel_url: process.env.STRIPE_CANCEL_SUB_URL,
    });
    console.log("checkout session", session);
    res.json(session.url);
  } catch (err) {
    console.log(err);
  } 
}; 



export const subscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    const updated = await User.findByIdAndUpdate(
      user._id,
      {
        subscriptions: subscriptions.data,
      },
      { new: true }
    );

    res.json(updated); 
  } catch (err) {
    console.log(err);
  }
}; 


export const subscriptions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    res.json(subscriptions);
  } catch (err) {
    console.log(err);
  }
};





export const customerPortal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: process.env.STRIPE_SUCCESS_SUB_URL,
    });
    res.json(portalSession.url);
  } catch (err) {
    console.log(err);
  }
};




export const buyEbook = async (req, res) => {
  // console.log(req.body);
  try {
    const user = await User.findById(req.user._id); 

    // const coupon = await stripe.coupons.create({
    //   duration: 'repeating',
    //   id: 'EAGLE20',
    //   percent_off: 20,
    //   duration_in_months: 1
    // });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1, 
        },
      ], 
      // discounts: [{
      //   coupon: 'EAGLE20',
      // }],
      customer: user.stripe_customer_id,
      success_url: process.env.STRIPE_SUCCESS_SUB_URL,
      cancel_url: process.env.STRIPE_CANCEL_SUB_URL,
    });
    console.log("checkout session", session);
    res.json(session.url);
  } catch (err) {
    console.log(err);
  }
}; 





// Retrieve the product from Stripe
 



// export const ebook = async (req, res) => {
//   const productID = 'prod_OnZTgrHzZRDakt';

//   try {
//     const product = await stripe.products.retrieve(productID);
//     const productJSON = JSON.stringify(product, null, 4);
//     console.log(productJSON);
//     res.status(200).json(product); // Respond with the product data or use it as needed.
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving product data');
//   }
// };





// export const ebook = async (req, res) => {
//   const productID = 'prod_OnZTgrHzZRDakt';

//   try {
//     // Retrieve the product details
//     const product = await stripe.products.retrieve(productID);

//     // Retrieve the default price object
//     const defaultPriceId = product.default_price;
//     const price = await stripe.prices.retrieve(defaultPriceId);

//     // Extract the unit amount and currency from the price object
//     const unitAmount = price.unit_amount;
//     const currency = price.currency;

//     // Add the unit amount and currency to the product object
//     product.unit_amount = unitAmount; 
//     product.currency = currency;

//     // const response = {
//     //   product,
//     //   unitAmount,
//     // };

//     res.status(200).json(product);  // Respond with the product data including the price unit
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error retrieving product data');
//   }
// };





export const ebook = async (req, res) => {
  try {
    // List all the products
    const products = await stripe.products.list();

    // Loop through the products and retrieve their default prices
    for (const product of products.data) {
      const defaultPriceId = product.default_price;
      const price = await stripe.prices.retrieve(defaultPriceId);

      // Extract the unit amount and currency from the price object
      const unitAmount = price.unit_amount;
      const currency = price.currency;

      // Add the unit amount and currency to the product object
      product.unitAmount = unitAmount;
      product.currency = currency; 
    }

    res.status(200).json(products.data);  // Respond with the list of products, each including the price unit
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving product data');
  }
};


// PAYSTACK INTEGRATION 

export const plans = async(req, res)=> {

  try{
    let fetchPlansResponse = await paystack.plan.list({});

    if (fetchPlansResponse.status === false) {
      console.log('Error fetching plans: ', fetchPlansResponse.message);
      return res
        .status(400)
        .send(`Error fetching subscriptions: ${fetchPlansResponse.message}`);
    }

  return res.status(200).send(fetchPlansResponse.data.reverse());
  } catch(err) {
    console.log(err)
  }
} 


// export const paystackSubscription = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id); 

//     // if (!customer || !plan) {
//     //   throw Error('Please provide a valid customer code and plan ID');
//     // }

//     let createSubscriptionResponse = await paystack.subscription.create({
      
//     });

//     if (createSubscriptionResponse.status === false) {
//       return console.log(
//         'Error creating subscription: ',
//         createSubscriptionResponse.message
//       );
//     }
//     let stackSubscription = createSubscriptionResponse.data;
//     return res.status(200).send(stackSubscription);
//   } catch (error) {
//     return res.status(400).send(error.message);
//   }
// }; 


export const paystackSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Make sure you have a valid customer ID and plan ID
    if (!user.paystack_customer_id || !req.body) { //it was initially planId 
      throw new Error('Please provide a valid customer code and plan ID');
    }

    const customerId = user.paystack_customer_id; 
    const planCode = req.body; 


    // Define the subscription details
    const subscriptionData = {
      customer: customerId, 
      plan: planCode,
    };

    console.log("REQUEST BODY: ", planCode)

    // Create the subscription using Paystack API 
    const createSubscriptionResponse = await paystack.subscription.create(subscriptionData);

    if (!createSubscriptionResponse.status) {
      return res.status(400)
      // .json({
      //   error: 'Error creating Paystack subscription',
      //   message: `Plan code is invalid. Plan code: ${req.body}`,
      // }); 
    } 


    console.log(createSubscriptionResponse);

    const stackSubscription = createSubscriptionResponse.data; 
    console.log(stackSubscription); 

    return res.status(200).json(stackSubscription);
  } catch (error) {
    console.log(error) 
    return res.status(400).json({ error: 'Subscription creation failed', message: error.message }); 
  }
};


 
 
 
