const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const OTP = require('../models/OTP');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to send real SMS via Fast2SMS (Retained for future multi-auth if needed)
const sendSMS = async (phoneNumber, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return { success: false, reason: "No API Key" };
  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: { authorization: apiKey, variables_values: otp, route: 'otp', numbers: phoneNumber }
    });
    return { success: response.data.return === true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// [POST] Google Login / Register
router.post('/google-login', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
      console.error("❌ [AUTH ERROR] No tokens provided in request body:", req.body);
      return res.status(400).json({ error: "No authentication token provided" });
    }

    let email, googleId, displayName, avatar;

    if (idToken) {
      // 1. Verify ID Token (Preferred for Web and Mobile)
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      googleId = payload.sub;
      displayName = payload.name;
      avatar = payload.picture;
    } else if (accessToken) {
      // 2. Verify Access Token (Fallback for Mobile)
      const googleResponse = await axios.get('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const profile = googleResponse.data;
      email = profile.email;
      googleId = profile.id;
      displayName = profile.name;
      avatar = profile.picture;
    }

    // Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        googleId,
        displayName,
        avatar,
        lastLogin: new Date()
      });
      await user.save();
      console.log(`🆕 [AUTH] New User Created via Google: ${email}`);
    } else {
      user.googleId = googleId;
      user.displayName = displayName || user.displayName;
      user.avatar = avatar || user.avatar;
      user.lastLogin = new Date();
      await user.save();
      console.log(`✅ [AUTH] Google User Logged In: ${email}`);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'goalpilot_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ user, token, message: "Google Login successful" });
  } catch (error) {
    console.error("❌ Google Login Verification Error:", error);
    res.status(401).json({ error: "Google Token Verification Failed", details: error.message });
  }
});

// [POST] Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Phone number required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to DB (expires in 5 mins)
    await OTP.findOneAndUpdate(
      { phoneNumber },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`🔑 [OTP] Generated for ${phoneNumber}: ${otp}`);

    // Try sending via SMS if API key exists
    const smsResult = await sendSMS(phoneNumber, otp);
    
    res.json({ 
      success: true, 
      message: smsResult.success ? "OTP sent via SMS" : "OTP generated (check server logs)",
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// [POST] Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const otpRecord = await OTP.findOne({ phoneNumber, otp });
    if (!otpRecord) return res.status(401).json({ error: "Invalid or expired OTP" });

    // Find or Create User
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        displayName: `User ${phoneNumber.slice(-4)}`,
        lastLogin: new Date()
      });
      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'goalpilot_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ user, token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
