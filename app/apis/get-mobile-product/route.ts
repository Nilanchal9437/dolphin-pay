import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { homeCategory } = await req.json();

    // ✅ fetch products per category
    const productsResponse = await OddoAxios.post(
      `/json/2/product.template/search_read`,
      {
        domain: [["categ_id", "=", parseInt(homeCategory)]],
        fields: ["id", "name", "description", "list_price", "categ_id", "valid_product_template_attribute_line_ids", "product_variant_ids", "product_variant_id", "recurring_invoice"],
      },
    ).then((res) => res.data);

    const products = productsResponse.filter(
      (product: any) => product?.categ_id?.[0] === parseInt(homeCategory),
    );

    const productAttributes = await Promise.allSettled(
      products.map(async (product: any) => {
        try {
          const attributeIds =
            product.valid_product_template_attribute_line_ids;

          if (!attributeIds || attributeIds.length === 0) {
            return { ...product, attributes: [] };
          }

          // ✅ Step 1: Fetch attribute lines
          const attributes = await OddoAxios.post(
            `/json/2/product.template.attribute.line/search_read`,
            {
              domain: [["id", "in", attributeIds]],
              fields: ["id", "attribute_id", "product_template_value_ids"],
            },
          ).then((res) => res.data);

          // ✅ Step 2: Fetch values for each attribute
          const enrichedAttributesResults = await Promise.allSettled(
            attributes.map(async (attr: any) => {
              try {
                if (
                  !attr.product_template_value_ids ||
                  attr.product_template_value_ids.length === 0
                ) {
                  return { ...attr, values: [] };
                }

                const values = await OddoAxios.post(
                  `/json/2/product.template.attribute.value/search_read`,
                  {
                    domain: [["id", "in", attr.product_template_value_ids]],
                    fields: ["id", "name", "attribute_id"],
                  },
                ).then((res) => res.data);

                return {
                  ...attr,
                  values,
                };
              } catch (error) {
                console.error(
                  `Error fetching values for attribute ${attr.id}`,
                  error,
                );

                return {
                  ...attr,
                  values: [],
                  error: true,
                };
              }
            }),
          );

          // ✅ Extract only fulfilled values
          const enrichedAttributes = enrichedAttributesResults
            .filter((item) => item.status === "fulfilled")
            .map((item: any) => item.value);

          return {
            ...product,
            attributes: enrichedAttributes,
          };
        } catch (error) {
          console.error(`Error processing product ${product.id}`, error);

          return {
            ...product,
            attributes: [],
            error: true,
          };
        }
      }),
    );

    // ✅ Final cleaned result
    const finalProducts = productAttributes
      .filter((item) => item.status === "fulfilled")
      .map((item: any) => item.value);

    if (finalProducts && Array.isArray(finalProducts)) {
      return NextResponse.json(
        {
          message: "Oddo mobile product fetch successful",
          data: finalProducts.sort((a: any, b: any) => a.id - b.id),
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Oddo mobile product fetch failed",
          data: productsResponse,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in Oddo mobile product API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
