import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    let response = await OddoAxios.post(`/json/2/product.product/search_read`, {
      domain: [["display_name", "=", "Voucher"]],
      fields: ["id", "name", "display_name", "product_tmpl_id"],
    }).then((res) => res.data);

    if (response && Array.isArray(response) && response.length > 0) {
      return NextResponse.json(
        {
          message: "Oddo product voucher fetch successful",
          data: response[0],
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Oddo product voucher fetch failed",
          data: response,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in Oddo product voucher API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
