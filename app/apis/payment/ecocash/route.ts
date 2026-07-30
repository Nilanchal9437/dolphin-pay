import { NextRequest, NextResponse } from "next/server";
import OddoAxios from "@/src/libs/Oddo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { searchParams } = new URL(req.url);

    const paramsObject = Object.fromEntries(searchParams.entries());

    const res = await OddoAxios.post(
      `/api/payment/initiate`,
      {
        payment_method: "ecocash",
        amount: body.amount,
        customer_name: body.customer_name,
        account_number: body.account_number,
        phone: body.phone,
        webhook_url: `${process.env.API_BASE_URL}/apis/payment/webhook?${searchParams.toString()}`,
      },
      {
        headers: {
          "X-API-Key": `${process.env.ECOCASH_API_KEY}`,
        },
      },
    );

    const data = await res.data;

    const response = NextResponse.json(data);

    Object.entries(paramsObject).forEach(([key, value]) => {
      response.cookies.set(key, value, {
        httpOnly: true,
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: "lax",
      });
    });

    response.cookies.set("transactionID", data?.transaction_id, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days
    });

    response.cookies.set("method", data?.payment_method, {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days
    });

    return response;
  } catch (error) {
    console.error("echocash API failed!", error);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 },
    );
  }
}
