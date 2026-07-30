import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const variantId = searchParams.get("variantId");

  if (!variantId) {
    return NextResponse.json({ message: "variantId required", data: null }, { status: 400 });
  }

  try {
    const variantData = await OddoAxios.post(
      `/json/2/product.product/search_read`,
      {
        domain: [["id", "=", parseInt(variantId)]],
        fields: ["product_tmpl_id"],
        limit: 1,
      },
    ).then((res) => res.data);

    if (!variantData || variantData.length === 0) {
      return NextResponse.json({ message: "Variant not found", data: [] }, { status: 200 });
    }

    const templateId = variantData[0].product_tmpl_id[0];

    const templateData = await OddoAxios.post(
      `/json/2/product.template/search_read`,
      {
        domain: [["id", "=", templateId]],
        fields: ["optional_product_ids"],
        limit: 1,
      },
    ).then((res) => res.data);

    if (
      !templateData ||
      templateData.length === 0 ||
      !templateData[0].optional_product_ids?.length
    ) {
      return NextResponse.json({ message: "No optional products", data: [] }, { status: 200 });
    }

    const optionalIds = templateData[0].optional_product_ids;

    const optionalProducts = await OddoAxios.post(
      `/json/2/product.template/search_read`,
      {
        domain: [["id", "in", optionalIds]],
        fields: ["id", "name", "display_name", "list_price", "product_variant_id"],
      },
    ).then((res) => res.data);

    return NextResponse.json(
      { message: "Optional products fetched", data: optionalProducts },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching optional products:", error);
    return NextResponse.json({ message: "Something went wrong", data: null }, { status: 500 });
  }
}
