import { NextRequest, NextResponse } from "next/server";

// In-memory user storage (shared with signup - in production use a database)
// For demo purposes, we'll create a default test user
const users: Map<string, {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}> = new Map();

// Add a default test user
users.set("test@example.com", {
  id: "user_default",
  email: "test@example.com",
  password: "Test1234",
  firstName: "Test",
  lastName: "User",
  role: "lister",
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Simple token generation
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = users.get(email);
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken();

    // Log login notification
    console.log("\n========================================");
    console.log("🔔 USER LOGIN NOTIFICATION");
    console.log("========================================");
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`📅 Time: ${new Date().toISOString()}`);
    console.log("========================================\n");

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "Login successful!",
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
