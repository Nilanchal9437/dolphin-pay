import OddoAxios from "@/src/libs/Oddo";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await OddoAxios.post(
      `/json/2/product.category/search_read`,
      {
        domain: [["parent_id", "=", false]],
        fields: ["id", "name", "display_name", "x_studio_label"],
      },
    ).then((res) => res.data);

    if (response) {
      return NextResponse.json(
        {
          message: "Oddo product categories fetch successful",
          data: response.sort((a: any, b: any) => a.id - b.id),
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { message: "Oddo product categories fetch failed", data: response },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in Oddo product categories API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
