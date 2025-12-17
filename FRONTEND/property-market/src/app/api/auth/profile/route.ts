import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // In a real app, verify the token and get user from database
    // For demo, return a mock profile
    return NextResponse.json({
      id: "user_1",
      email: "user@example.com",
      firstName: "Demo",
      lastName: "User",
      role: "lister",
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // In a real app, update user in database
    console.log("Profile update requested:", body);

    return NextResponse.json({
      id: "user_1",
      ...body,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
