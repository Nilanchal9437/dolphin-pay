import OddoAxios from "@/src/libs/Oddo";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { homeCategory } = await req.json();
    let response = await OddoAxios.post(
      `/json/2/product.category/search_read`,
      {
        domain: [["parent_id.id", "=", parseInt(homeCategory)]],
        limit: 20,
      },
    ).then((res) => res.data);

    response = response.filter((item: any) =>
      item?.name?.toLocaleLowerCase().includes("airtime"),
    );

    if (response) {
      const categoriesIds = response.map((category: any) => category.id);

      // ✅ fetch products per category
      const productsResponse = await Promise.allSettled(
        categoriesIds.map((id: number) =>
          OddoAxios.post(`/json/2/product.template/search_read`, {
            domain: [["categ_id", "=", id]], // simpler + correct
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
            (product: any) =>
              product?.categ_id?.[0] === category.id &&
              product?.name?.toLocaleLowerCase().includes("airtime zw"),
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
                    },
                  ).then((res) => res.data);

                  values = values.map((item: any) => {
                    const matchedVariant = variant.find(
                      (v: any) =>
                        v?.product_template_variant_value_ids?.includes(
                          item.id,
                        ) ||
                        v?.product_template_attribute_value_ids?.includes(
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
          data: response.sort((a: any, b: any) => a.id - b.id),
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
