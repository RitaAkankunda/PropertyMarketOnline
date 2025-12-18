import { NextRequest, NextResponse } from "next/server";

// In-memory user storage (replace with database in production)
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

// Simple token generation (use JWT in production)
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role } = body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (users.has(email)) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const now = new Date().toISOString();
    
    const newUser = {
      id: userId,
      email,
      password, // In production, hash this password!
      firstName,
      lastName,
      phone,
      role,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    users.set(email, newUser);

    // Generate token
    const token = generateToken();

    // Log registration notification (this simulates sending notification)
    console.log("\n========================================");
    console.log("🔔 NEW USER REGISTRATION NOTIFICATION");
    console.log("========================================");
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`📱 Phone: ${phone || "Not provided"}`);
    console.log(`🏷️ Role: ${role}`);
    console.log(`📅 Time: ${now}`);
    console.log("========================================\n");

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: "Registration successful!",
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
