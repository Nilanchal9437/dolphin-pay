import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { attributeIds }: { attributeIds: number[] } = await req.json();

    let response = await OddoAxios.post(
      `/json/2/product.template.attribute.value/search_read`,
      {
        domain: [["id", "in", attributeIds]],
        fields: ["id", "name", "attribute_id"],
      },
    ).then((res) => res.data);

    if (response) {
      return NextResponse.json(
        {
          message: "Oddo product attribute value fetch successful",
          data: response.sort((a: any, b: any) => a.id - b.id),
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Oddo product attribute value fetch failed",
          data: response,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in Oddo product attribute value API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
