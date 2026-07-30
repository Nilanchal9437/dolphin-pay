import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { homeCategory, services } = await req.json();
    let response = await OddoAxios.post(
      `/json/2/product.category/search_read`,
      {
        domain: [["parent_id.id", "=", parseInt(homeCategory)]],
        fields: ["id", "name", "display_name", "x_studio_label"],
      },
    ).then((res) => res.data);

    if (services.length > 0) {
      const filterservices = services.map((str: string) =>
        str.toLowerCase() === "FIBRE".toLocaleLowerCase()
          ? "Fiber".toLowerCase()
          : str.toLowerCase(),
      );

      response = response.filter(
        (item: any) =>
          !item?.name?.toLocaleLowerCase().includes("equipment") &&
          filterservices.includes(item?.name?.toLocaleLowerCase()),
      );
    }

    if (response) {
      const categoriesIds = response.map((category: any) => category.id);

      // ✅ fetch products per category
      const productsResponse = await Promise.allSettled(
        categoriesIds.map((id: number) =>
          OddoAxios.post(`/json/2/product.template/search_read`, {
            domain: [["categ_id", "=", id]],
            fields: ["id", "name", "description", "list_price", "categ_id", "valid_product_template_attribute_line_ids", "product_variant_ids", "product_variant_id", "recurring_invoice", "x_equipment_ids"],
          }),
        ),
      ).then(
        (results) =>
          results
            .map((r) => (r.status === "fulfilled" ? r.value.data : []))
            .flat(), // ✅ flatten all product arrays
      );

      response = await Promise.all(
        response.map(async (category: any) => {
          const products = productsResponse.filter(
            (product: any) => product?.categ_id?.[0] === category.id,
          );

          const productAttributes = await Promise.all(
            products.map(async (product: any) => {
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
                        v.product_template_attribute_value_ids?.includes(
                          item.id,
                        ),
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
                    values, 
                  };
                }),
              );

              return {
                ...product,
                attributes: enrichedAttributes,
              };
            }),
          );

          return {
            ...category,
            products: productAttributes,
          };
        }),
      );
    }
    if (response) {
      return NextResponse.json(
        {
          message: "successful",
          data: response.sort((a: any, b: any) => {
            const PRIORITY: Record<string, number> = { fiber: 0, fibre: 0, fwa: 1, lte: 2 };
            const aPriority = PRIORITY[(a.name ?? "").toLowerCase()] ?? 99;
            const bPriority = PRIORITY[(b.name ?? "").toLowerCase()] ?? 99;
            return aPriority - bPriority;
          }),
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "home categories fetch failed",
          data: response,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in home categories API route:", error);
    return NextResponse.json(
      { message: "Something went wrong", data: null },
      { status: 500 },
    );
  }
}
