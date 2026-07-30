"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { CiLocationOn } from "react-icons/ci";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import { getProductCategories } from "@/src/features/businessInternet/apis/productCategories";
import { HomeInternetProductCategory } from "@/src/features/businessInternet/types/type";
import cn from "classnames";

function PlanCardSkeleton() {
  return (
    <div className="relative border border-[#e5e7eb] bg-white rounded-xl p-5 animate-pulse mb-5">
      <div className="flex justify-between items-center gap-x-4">
        <div className="h-8 w-full bg-gray-200 rounded"></div>
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function Plan() {
  const search = useSearchParams();

  if (!search.get("homeCategory")) {
    redirect("/");
  } else if (
    !search.get("location") ||
    !search.get("services") ||
    !search.get("coordinates") ||
    !search.get("city")
  ) {
    redirect(`/business-internet?homeCategory=${search.get("homeCategory")}`);
  } else {
    const [selected, setSelected] = useState("");
    const [categoryOpen, setCategoryOpen] = useState({ name: "", id: "" });
    const [loading, setLoading] = useState(true);
    const [selectedAttribute, setSelectedAttribute] = useState<number[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<
      {
        variant_id: number;
        variant_name: string;
      }[]
    >([]);
    const [categories, setCategories] = useState<HomeInternetProductCategory[]>(
      [],
    );
    const [price, setPrice] = useState<number | null>(null);

    const router = useRouter();
    const params = new URLSearchParams(search);

    const handleSelect = (
      attrIndex: number,
      attributeId: number,
      valueId: number,
      variant_name: string,
    ) => {
      setSelectedAttribute((prev) => {
        const updated = [...prev];
        updated[attrIndex] = attributeId; // 👈 store by index
        return updated;
      });
      setSelectedVariant((prev) => {
        const updated = [...prev];
        updated[attrIndex] = {
          variant_id: valueId,
          variant_name: variant_name,
        };
        return updated;
      });
      const updated = [...selectedAttribute];
      updated[attrIndex] = attributeId;
      const variant = [...selectedVariant];
      variant[attrIndex] = { variant_id: valueId, variant_name: variant_name };
      params.set("attribute", JSON.stringify([...updated]));
      params.set("variant", JSON.stringify([...variant]));
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    };

    const getCategories = async () => {
      try {
        setLoading(true);
        const res = await getProductCategories(
          search.get("homeCategory") || "",
          JSON.parse(`${search.get("services")}`) || [],
        );
        if (res.status && Array.isArray(res?.data)) {
          setCategories(res.data as HomeInternetProductCategory[]);
          if (
            search.get("childCategory") &&
            search.get("product") &&
            search.get("price") &&
            search.get("attribute")
          ) {
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}?${params.toString()}`,
            );
            setSelectedAttribute(JSON.parse(search.get("attribute") ?? "[]"));
            setCategoryOpen({
              id: search.get("childCategory") ?? "",
              name: search.get("childCategoryName") ?? "",
            });
            setSelected(search.get("product") ?? "");
            setPrice(parseInt(search.get("price") ?? "") ?? 0);
          } else {
            const data = res?.data[0];
            setCategoryOpen({
              id: `${data?.id}`,
              name: `${data?.name}`,
            });
            params.set("childCategory", `${data?.id}`);
            params.set("childCategoryName", `${data?.name}`);
            if (data?.products?.length) {
              const product = data.products[0];
              setSelected(`${product?.product_variant_id[0]}`);
              setPrice(parseInt(`${product?.list_price}`));
              params.set("product", `${product?.product_variant_id[0]}`);
              if (product.recurring_invoice) {
                params.set("planId", "1");
              }
              params.set("price", `${product?.list_price}`);
              params.set("productName", `${product?.product_variant_id[1]}`);
              if (product?.attributes?.length) {
                const attribute = product?.attributes.map(
                  (item) => item.values[0].id,
                );

                const variant = product?.attributes.map((item) => ({
                  variant_id: item.values[0].variant_id,
                  variant_name: item.values[0].variant_name,
                }));

                setSelectedAttribute(attribute);
                setSelectedVariant(variant);
                params.set("attribute", JSON.stringify([...attribute]));
                params.set("variant", JSON.stringify([...variant]));
              }
            }
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}?${params.toString()}`,
            );
          }
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      getCategories();
    }, []);

    return (
      <div className="w-full">
        <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
          {/* Header */}
          <div className="text-sm text-[#6b7280] mb-2">
            <div className="flex gap-1 items-center">
              <CiLocationOn color="#F2A413" size={15} strokeWidth={1} />
              <span className="font-medium text-[#F2A413]">
                {`${search.get("location")}`}
              </span>
              <button className="ml-2 text-[#2563eb] underline">
                <Link
                  href={`/business-internet?homeCategory=${search.get("homeCategory")}`}
                >
                  Change
                </Link>
              </button>
            </div>
          </div>

          <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[120%] tracking-normal mt-4">
            Choose Your Plan
          </h1>
          <p className="mt-2 font-exo font-normal text-[12px] lg:text-[14px] leading-[100%] tracking-[0%] text-[#2C6176] mb-6">
            Available services in your area. Expand a connection type to see
            packages.
          </p>

          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <PlanCardSkeleton key={i} />
              ))
            : categories.map((category) => (
                <div
                  className={cn("border border-[#d1d5db] rounded-xl mb-4", {
                    "opacity-50": category.products.length === 0,
                  })}
                  key={category.id}
                >
                  <div className="flex justify-between items-center p-4">
                    <div>
                      <h2 className="font-semibold text-[#111827]">
                        {category.name}{" "}
                        {category.name.toLocaleLowerCase() === "fiber" ? (
                          <span className="px-2 bg-[#0CAB461A] text-[#0CAB46] text-[12px] rounded-lg font-normal">
                            recommended
                          </span>
                        ) : (categories.length > 1 && (category.name.toLocaleLowerCase() === "lte" || category.name.toLocaleLowerCase() === "fwa")) ? (
                          <span className="px-2 bg-[#fff7ed] text-[#F2A413] text-[12px] rounded-lg font-normal">
                            Subject to availability
                          </span>
                        ) : null}
                      </h2>
                      {category.name.toLocaleLowerCase() === "fiber" ? (
                        <p className="text-sm text-[#6b7280]">
                          Stable wired connectivity
                        </p>
                      ) : category.name.toLocaleLowerCase() === "lte" ? (
                        <p className="text-sm text-[#6b7280]">
                          Stay seamlessly connected
                        </p>
                      ) : (
                        <p className="text-sm text-[#6b7280]">
                          Available at your address
                        </p>
                      )}
                    </div>
                    {category.products.length > 0 ? (
                      <button
                        onClick={() => {
                          setSelectedAttribute([]); // reset attribute selection when switching categories
                          setSelected(""); // reset plan selection when switching categories
                          if (categoryOpen.id === category.id.toString()) {
                            setCategoryOpen({ name: "", id: "" });
                          } else {
                            setCategoryOpen({
                              id: category.id.toString(),
                              name: category.name,
                            });
                            params.set("childCategory", category.id.toString());
                            params.set("childCategoryName", category.name);
                            params.delete("product");
                            params.delete("price");
                            params.delete("attribute");
                            params.delete("variant");
                            params.delete("productName");
                            const product = category.products[0];
                            setSelected(`${product?.product_variant_id[0]}`);
                            setPrice(parseInt(`${product?.list_price}`));
                            if (product.recurring_invoice) {
                              params.set("planId", "1");
                            }
                            params.set(
                              "product",
                              `${product?.product_variant_id[0]}`,
                            );
                            params.set(
                              "productName",
                              `${product?.product_variant_id[1]}`,
                            );
                            params.set("price", `${product?.list_price}`);
                            if (product?.attributes?.length) {
                              const attribute = product?.attributes.map(
                                (item) => item.values[0].id,
                              );
                              const variant = product?.attributes.map(
                                (item) => ({
                                  variant_id: item.values[0].variant_id,
                                  variant_name: item.values[0].variant_name,
                                }),
                              );

                              setSelectedVariant(variant);
                              setSelectedAttribute(attribute);
                              params.set(
                                "attribute",
                                JSON.stringify([...attribute]),
                              );
                              params.set(
                                "variant",
                                JSON.stringify([...variant]),
                              );
                            } else {
                              setSelectedVariant([]);
                              setSelectedAttribute([]);
                              params.delete("attribute");
                              params.delete("variant");
                            }
                            window.history.replaceState(
                              null,
                              "",
                              `${window.location.pathname}?${params.toString()}`,
                            );
                          }
                        }}
                        className="px-4 py-2 border rounded-lg text-sm"
                      >
                        {category.id.toString() === categoryOpen.id
                          ? "Collapse"
                          : "Expand"}
                      </button>
                    ) : (
                      <span className="text-sm">Unavailable</span>
                    )}
                  </div>

                  {category.id.toString() === categoryOpen.id && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                      {category.products.map((plan) => {
                        const isProductSelected =
                          selected === plan.product_variant_id[0].toString();

                        return (
                          <div
                            key={plan.id}
                            className={`relative border rounded-xl p-5 cursor-pointer transition
                        ${
                          isProductSelected
                            ? "border-[#f59e0b] bg-[#fff7ed]"
                            : "border-[#e5e7eb] bg-white"
                        }`}
                            onClick={() => {
                              setSelected(plan.product_variant_id[0].toString());
                              setPrice(plan.list_price);
                              setSelectedAttribute([]);
                              if (plan.recurring_invoice) {
                                params.set("planId", "1");
                              }
                              params.set("product", plan.product_variant_id[0].toString());
                              params.set("price", plan.list_price.toString());
                              params.set("productName", `${plan?.product_variant_id[1]}`);
                              params.delete("attribute");
                              if (plan?.attributes?.length) {
                                const attribute = plan?.attributes.map((item) => item.values[0].id);
                                const variant = plan?.attributes.map((item) => ({
                                  variant_id: item.values[0].variant_id,
                                  variant_name: item.values[0].variant_name,
                                }));
                                setSelectedAttribute(attribute);
                                setSelectedVariant(variant);
                                params.set("attribute", JSON.stringify([...attribute]));
                                params.set("variant", JSON.stringify([...variant]));
                              } else {
                                setSelectedVariant([]);
                                setSelectedAttribute([]);
                                params.delete("attribute");
                                params.delete("variant");
                              }
                              window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
                            }}
                          >
                            {/* {plan.popular && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f59e0b] text-white text-xs px-3 py-1 rounded-full">
                                MOST POPULAR
                              </span>
                            )} */}

                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-semibold">
                                {plan.name}
                              </h3>
                              <div className="w-5">
                                <div
                                  className={cn(
                                    `w-5 h-5 rounded-full border flex items-center justify-center`,
                                    {
                                      "bg-[#f59e0b] border-[#f59e0b]":
                                        isProductSelected,
                                      "border-[#d1d5db]": !isProductSelected,
                                    },
                                  )}
                                >
                                  {isProductSelected && (
                                    <FaCheck className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-[#111827] font-medium mb-3">
                              {isProductSelected && price
                                ? `$${price}/ mo`
                                : `$${plan.list_price}/ mo`}
                            </p>

                            <hr className="mb-3" />

                            {plan?.description ? (
                              <div
                                className="text-[#111827] font-sm mb-3"
                                dangerouslySetInnerHTML={{
                                  __html: plan.description,
                                }}
                              />
                            ) : null}

                            <ul className="space-y-2 text-sm text-[#374151]">
                              {plan.attributes.map((attr, attrIndex) => (
                                <li
                                  key={attrIndex}
                                  className="flex flex-col gap-2"
                                >
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: attr.display_name,
                                    }}
                                  />
                                  <ul className="space-y-2 text-sm text-[#374151]">
                                    {attr.values.map((value, i) => {
                                      const isSelected =
                                        selectedVariant[attrIndex]
                                          ?.variant_id === value.variant_id;
                                      return (
                                        <li
                                          key={i}
                                          className="flex items-center gap-2 ml-4 pr-3 cursor-pointer w-full"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (isProductSelected) {
                                              setPrice(
                                                plan.list_price +
                                                  value.price_extra,
                                              );
                                              handleSelect(
                                                attrIndex,
                                                value.id,
                                                value.variant_id,
                                                value.variant_name,
                                              );
                                              const finalPrice =
                                                plan.list_price +
                                                value.price_extra;

                                              params.set(
                                                "price",
                                                finalPrice.toString(),
                                              );

                                              window.history.replaceState(
                                                null,
                                                "",
                                                `${window.location.pathname}?${params.toString()}`,
                                              );
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-2 w-full">
                                            <span
                                              className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]",
                                                {
                                                  "bg-[#f59e0b]": isSelected,
                                                  "bg-gray-300": !isSelected,
                                                },
                                              )}
                                            >
                                              {isSelected ? <FaCheck /> : null}
                                            </span>
                                            <div className="flex items-center justify-between w-[92%]">
                                              <p>{value.name}</p>
                                              <p>${value.price_extra}</p>
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          {/* Footer */}
          <div className="flex flex-col lg:flex-row gap-y-4 justify-between mt-6">
            <button
              className="px-6 py-3 border border-[#1f2937] rounded-lg"
              onClick={() => {
                router.push(
                  `/business-internet?homeCategory=${search.get("homeCategory")}`,
                );
              }}
            >
              Back
            </button>
            <button
              className="px-6 py-3 bg-[#1f4d5a] text-white rounded-lg"
              disabled={loading}
              onClick={() => {
                if (
                  price &&
                  selected &&
                  search.get("homeCategory") &&
                  search.get("location") &&
                  search.get("childCategory") &&
                  search.get("product") &&
                  search.get("price") &&
                  categoryOpen
                ) {
                  router.push(`/business-internet/extras?${params.toString()}`);
                }
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }
}
