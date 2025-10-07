import { Hono } from 'hono';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// IMPORTANT: This in-memory map will reset on every deploy and periodically.
// For a real app, use a persistent database like Cloudflare KV or D1.
const users = new Map();
users.set("existinguser", { username: "existinguser" });

const app = new Hono();

// Middleware to parse JSON body
app.use('*', async (c, next) => {
  if (c.req.method === 'POST' || c.req.method === 'PUT') {
    try {
      const body = await c.req.json();
      c.req.body = body;
    } catch (e) {
      c.req.body = {};
    }
  }
  await next();
});

// Route for username validation (FIXED: removed /api prefix)
app.post('/validate-username', async (c) => {
  const { username } = c.req.body;
  if (!username) {
    return c.json({ available: false, message: "Username is required." }, 400);
  }
  const isTaken = users.has(username.toLowerCase());
  return c.json({ available: !isTaken });
});

// Route for form submission (FIXED: removed /api prefix)
app.post('/submit-form', async (c) => {
  const { username, email, password } = c.req.body;

  // Basic validation (more complex validation can be added)
  if (!username || username.length < 3) {
    return c.json({ success: false, message: "Username must be at least 3 chars." }, 400);
  }
  if (users.has(username.toLowerCase())) {
     return c.json({ success: false, message: "Username is already taken." }, 400);
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
     return c.json({ success: false, message: "Please provide a valid email." }, 400);
  }
  if (!password || password.length < 8) {
     return c.json({ success: false, message: "Password must be at least 8 chars." }, 400);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now().toString(),
      username: username,
      email: email,
      ...c.req.body,
      password: hashedPassword,
      registeredAt: new Date().toISOString()
    };
    
    users.set(username.toLowerCase(), newUser);
    console.log(`[INFO] New user registered: ${username}`);
    
    const userResponse = { ...newUser };
    delete userResponse.password;

    return c.json({
      success: true,
      message: "Registration successful!",
      user: userResponse
    }, 201);

  } catch (error) {
    console.error(`[ERROR] Registration failed:`, error);
    return c.json({ success: false, message: "An internal server error occurred." }, 500);
  }
});

export const onRequest = app.fetch;