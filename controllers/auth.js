import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import AWS from "aws-sdk";
const stripe = require("stripe")(process.env.STRIPE_SECRET); 
const paystack = require("paystack")(process.env.PAYSTACK_SECRET); 


const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};
 
const SES = new AWS.SES(awsConfig);

export const register = async(req, res)=>{
  try {
      //console.log(req.body)  
      const {name, email, password, role, location} = req.body 
      //convert email to lowercase
      const lowercasedEmail = email.toLowerCase()
      //validation 
      if(!name) return res.status(400).send("Name is required") 
      if(!password || password.length < 8 ) {
          return res.status(400).send("Password is required and should be minimum 8 characters") 
      }
      let userExist = await User.findOne({email: lowercasedEmail}).exec() 
      if(userExist) return res.status(400).send("A user already exists with this email")

      // hash password 
      const hashedPassword = await hashPassword(password)  

      // create account with stripe
      const customer = await stripe.customers.create({
        email,
        name
      })
      console.log('STRIPE CUSTOMER', customer) 

      const paystackCustomer = await paystack.customer.create({
        email,
        name
      }); 
      console.log("PAYSTACK CUSTOMER ", paystackCustomer)

      // register 
      const user = new User({
          name,
          email: lowercasedEmail,
          password: hashedPassword, 
          role,
          location,
          stripe_customer_id: customer.id ,
          paystack_customer_id: paystackCustomer.data.customer_code,
          paystack_customer: paystackCustomer, 
      })
      await user.save() 
      console.log("saved user", user) 
      return res.json({success: true, user})  
  } catch (err) {
      console.log(err) 
      return res.status(400).send('Error. Try again') 
  }
}


export const login = async(req, res)=>{
  try {
     //console.log(req.body) 
     const {email, password} = req.body 
     const lowercasedEmail = email.toLowerCase()
     // check if user with that email exists in our database 
     const user = await User.findOne({email: lowercasedEmail}).exec() 
     if(!user) return res.status(400).send("No user found") 
     // check password 
     const match = await comparePassword(password, user.password) 
     if (!match) {
      return res.status(400).send("Password is incorrect");
  }
     // create signed jwt 
     const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"}) 
     //return user and token to client excluding hashed password 
     user.password = undefined 
     // send token in cookie 
     res.cookie("token", token, {
      httpOnly: true,
      // secure: true // works with ssl
     })
     // send user as json response 
     res.json(user)
  } catch (err) {
      console.log(err) 
      res.status(400).send("Error. Please try again")
  }
}  


export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Signout success" });
  } catch (err) {
    console.log(err);
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").exec();
    console.log("CURRENT_USER", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // console.log(email);
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found");

    // prepare for email
    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
                <html>
                  <h1>Reset password</h1>
                  <p>User this code to reset your password</p>
                  <h2 style="color:red;">${shortCode}</h2>
                  <i>edemy.com</i>
                </html>
              `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Reset Password",
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    // console.table({ email, code, newPassword });
    const hashedPassword = await hashPassword(newPassword);

    const user = User.findOneAndUpdate(
      {
        email,
        passwordResetCode: code,
      },
      {
        password: hashedPassword,
        passwordResetCode: "",
      }
    ).exec();
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
};
