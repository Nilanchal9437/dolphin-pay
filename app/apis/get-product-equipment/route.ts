import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { parentCategory, equipmentType, productId } = await req.json();

    let response = await OddoAxios.post(
      `/json/2/product.category/search_read`,
      {
        domain: [["parent_id.id", "=", parseInt(parentCategory)]],
        fields: ["id", "name", "display_name", "x_studio_label"],
      },
    ).then((res) => res.data);

    if (response) {
      const euipment = response.find((category: any) =>
        category.name.includes(equipmentType),
      );

      // ✅ fetch products per category
      const productsResponse = await OddoAxios.post(
        `/json/2/product.template/search_read`,
        {
          domain: [["product_variant_ids", "in", parseInt(productId)]],
          fields: ["id", "name", "x_equipment_ids"],
        },
      ).then((response) => response.data[0]);

      let productAttributes: any[] = [];

      const equipmentIds = productsResponse?.x_equipment_ids;

      if (!equipmentIds || equipmentIds.length === 0) {
        productAttributes = [];
      } else {
        // ✅ Step 1: Fetch attribute lines
        const equipments = await OddoAxios.post(
          `/json/2/product.product/search_read`,
          {
            domain: [["id", "in", equipmentIds]],
            fields: ["id", "name", "display_name", "list_price", "recurring_invoice", "valid_product_template_attribute_line_ids"],
          },
        ).then((response) => response.data);

        const enrichedEquipments = await Promise.all(
          equipments.map(async (product: any) => {
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
            const enrichedAttributes = await Promise.all(
              attributes.map(async (attr: any) => {
                if (
                  !attr.product_template_value_ids ||
                  attr.product_template_value_ids.length === 0
                ) {
                  return { ...attr, values: [] };
                }

                let values = await OddoAxios.post(
                  `/json/2/product.template.attribute.value/search_read`,
                  {
                    domain: [["id", "in", attr.product_template_value_ids]],
                    fields: ["id", "name", "attribute_id"],
                  },
                ).then((res) => res.data);

                const variant = await OddoAxios.post(
                  `/json/2/product.product/search_read`,
                  {
                    domain: [
                      "|",
                      [
                        "product_template_attribute_value_ids",
                        "in",
                        values.map((v: any) => v.id),
                      ],
                      [
                        "product_template_variant_value_ids",
                        "in",
                        values.map((v: any) => v.id),
                      ],
                    ],
                    fields: ["id", "display_name", "product_template_attribute_value_ids", "product_template_variant_value_ids"],
                  },
                ).then((res) => res.data);

                values = values.map((item: any) => {
                  const matchedVariant = variant.find(
                    (v: any) =>
                      v?.product_template_variant_value_ids?.includes(
                        item.id,
                      ) ||
                      v.product_template_attribute_value_ids?.includes(item.id),
                  );

                  return {
                    ...item,
                    ...(matchedVariant && {
                      variant_id: matchedVariant.id,
                      variant_name: matchedVariant.display_name,
                    }),
                  };
                });

                return {
                  ...attr,
                  values, // 👈 attach here
                };
              }),
            );

            return {
              ...product,
              attributes: enrichedAttributes,
            };
          }),
        );

        productAttributes = [{
          ...productsResponse,
          equipments: enrichedEquipments,
        }];
      }

      response = {
        ...euipment,
        products: productAttributes,
      };

      return NextResponse.json(
        {
          message: "Oddo product equipment fetch successful",
          data: response,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Oddo product equipment fetch failed",
          data: response,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in Oddo product equipment API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
