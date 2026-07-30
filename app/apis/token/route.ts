import { NextResponse } from "next/server";
import { generateVoucherToken } from "@/src/libs/generateToken";

export async function GET(req: Request) {
  try {
    const userAgent = req.headers.get("user-agent") || "unknown-client";
    const token = await generateVoucherToken(userAgent);

    const response = NextResponse.json({ token });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Token generation failed" }, { status: 500 });
  }
}
