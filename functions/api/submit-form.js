import bcrypt from 'bcryptjs';

// This will be replaced with a real database in a real app
const users = new Map();
users.set("existinguser", { username: "existinguser" });

export async function onRequestPost(context) {
  try {
    const { username, email, password, ...otherFields } = await context.request.json();

    // Basic validation
    if (!username || username.length < 3) {
      return new Response(JSON.stringify({ success: false, message: "Username must be at least 3 chars." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (users.has(username.toLowerCase())) {
      return new Response(JSON.stringify({ success: false, message: "Username is already taken." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
       return new Response(JSON.stringify({ success: false, message: "Please provide a valid email." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (!password || password.length < 8) {
       return new Response(JSON.stringify({ success: false, message: "Password must be at least 8 chars." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      ...otherFields,
      password: hashedPassword,
      registeredAt: new Date().toISOString()
    };
    
    users.set(username.toLowerCase(), newUser);
    console.log(`[INFO] New user registered: ${username}`);
    
    const userResponse = { ...newUser };
    delete userResponse.password;

    const responseData = {
      success: true,
      message: "Registration successful!",
      user: userResponse
    };

    return new Response(JSON.stringify(responseData), { status: 201, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(`[ERROR] Registration failed:`, error);
    return new Response(JSON.stringify({ success: false, message: "An internal server error occurred." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}