"use client";

import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import { EquipmentCategory } from "@/src/types";
import cn from "classnames";

export default function EquipmentVariant({
  categories,
  onEquipmentChange,
}: {
  categories: EquipmentCategory[];
  onEquipmentChange?: (variantId: string, recurring: boolean) => void;
}) {
  const search = useSearchParams();
  const router = useRouter();

  const [selected, setSelected] = useState("");
  const [categoryOpen, setCategoryOpen] = useState({ name: "", id: "" });
  const [selectedAttribute, setSelectedAttribute] = useState<number[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<
    {
      variant_id: number;
      variant_name: string;
    }[]
  >([]);
  const [price, setPrice] = useState<number | null>(null);
  const params = new URLSearchParams(search);

  useEffect(() => {
    if (categories.length > 0) {
      if (
        search.get("childEquipment") &&
        search.get("productEquipment") &&
        search.get("priceEquipment") &&
        search.get("attributeEquipment")
      ) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`,
        );
        setSelectedAttribute(
          JSON.parse(search.get("attributeEquipment") ?? "[]"),
        );
        setCategoryOpen({
          id: search.get("childEquipment") ?? "",
          name: search.get("childEquipmentName") ?? "",
        });
        setSelected(search.get("productEquipment") ?? "");
        setPrice(parseInt(search.get("priceEquipment") ?? "") ?? 0);
      } else {
        const data = categories[0];
        setCategoryOpen({
          id: `${data?.id}`,
          name: `${data?.name}`,
        });
        params.set("childEquipment", `${data?.id}`);
        params.set("childEquipmentName", `${data?.name}`);
        if (data?.products?.length && data?.products[0]?.equipments?.length) {
          const product = data?.products[0]?.equipments[0];
          setSelected(`${product?.id}`);
          setPrice(parseInt(`${product?.list_price}`));
          params.set("productEquipment", `${product?.id}`);
          if (product.recurring_invoice) {
            params.set("planId", "1");
          } else {
            params.delete("planId");
          }
          params.set("priceEquipment", `${product?.list_price}`);
          params.set("productNameEquipment", `${product?.name}`);
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
            params.set("attributeEquipment", JSON.stringify([...attribute]));
            params.set("variantEquipment", JSON.stringify([...variant]));
          }
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${params.toString()}`,
          );
          onEquipmentChange?.(`${product?.id}`, !!product.recurring_invoice);
        } else {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${params.toString()}`,
          );
        }
      }
    }
  }, []);

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
    params.set("attributeEquipment", JSON.stringify([...updated]));
    params.set("variantEquipment", JSON.stringify([...variant]));
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  };

  return (
    <div className="w-full mt-5">
      {categories.map((category) => (
        <div
          className={cn("border border-[#d1d5db] rounded-xl mb-4", {
            "opacity-50": category.products.length === 0,
          })}
          key={category.id}
        >
          <div className="flex justify-between items-center p-4">
            <div>
              <h2 className="font-semibold text-[#111827]">{category.name}</h2>
              {category.products.length > 0 ? (
                <p className="text-sm text-[#6b7280]">
                  Stable wired connection
                </p>
              ) : (
                <p className="text-sm text-[#6b7280]">
                  Not available at your address
                </p>
              )}
            </div>
            {category.products.length > 0 ? (
              <button
                onClick={() => {
                  if (categoryOpen.id === category.id.toString()) {
                    setCategoryOpen({ name: "", id: "" });
                  } else {
                    setCategoryOpen({
                      id: category.id.toString(),
                      name: category.name,
                    });
                    params.set("childEquipment", category.id.toString());
                    params.set("childEquipmentName", category.name);
                    params.delete("productEquipment");
                    params.delete("priceEquipment");
                    params.delete("attributeEquipment");
                    params.delete("variantEquipment");
                    params.delete("productNameEquipment");
                    const product = category.products[0];
                    setSelected(`${product?.id}`);
                    setPrice(parseInt(`${product?.list_price}`));
                    params.set("productEquipment", `${product?.id}`);
                    if (product.recurring_invoice) {
                      params.set("planId", "1");
                    } else {
                      params.delete("planId");
                    }
                    params.set("productNameEquipment", `${product?.name}`);
                    params.set("priceEquipment", `${product?.list_price}`);
                    if (product?.attributes?.length) {
                      const attribute = product?.attributes.map(
                        (item) => item.values[0].id,
                      );
                      const variant = product?.attributes.map((item) => ({
                        variant_id: item.values[0].variant_id,
                        variant_name: item.values[0].variant_name,
                      }));

                      setSelectedVariant(variant);
                      setSelectedAttribute(attribute);
                      params.set(
                        "attributeEquipment",
                        JSON.stringify([...attribute]),
                      );
                      params.set(
                        "variantEquipment",
                        JSON.stringify([...variant]),
                      );
                    } else {
                      setSelectedVariant([]);
                      setSelectedAttribute([]);
                      params.delete("attributeEquipment");
                      params.delete("variantEquipment");
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
              {category.products.map((equipment) =>
                equipment.equipments.map((plan) => {
                  const isSelected = selected === plan.id.toString();

                  return (
                    <div
                      key={plan.id}
                      className={`relative border rounded-xl p-5 cursor-pointer transition
                        ${
                          isSelected
                            ? "border-[#f59e0b] bg-[#fff7ed]"
                            : "border-[#e5e7eb] bg-white"
                        }`}
                      onClick={() => {
                        if (isSelected) return;
                        const currentParams = new URLSearchParams(window.location.search);
                        setSelected(plan.id.toString());
                        setPrice(plan.list_price);
                        currentParams.set("productEquipment", plan.id.toString());
                        if (plan.recurring_invoice) {
                          currentParams.set("planId", "1");
                        } else {
                          currentParams.delete("planId");
                        }
                        currentParams.set("priceEquipment", plan.list_price.toString());
                        currentParams.set("productNameEquipment", `${plan?.name}`);
                        currentParams.delete("attributeEquipment");
                        if (plan?.attributes?.length) {
                          const attribute = plan?.attributes.map(
                            (item) => item.values[0].id,
                          );
                          const variant = plan?.attributes.map(
                            (item) => ({
                              variant_id: item.values[0].variant_id,
                              variant_name: item.values[0].variant_name,
                            }),
                          );
                          setSelectedAttribute(attribute);
                          setSelectedVariant(variant);
                          currentParams.set("attributeEquipment", JSON.stringify([...attribute]));
                          currentParams.set("variantEquipment", JSON.stringify([...variant]));
                        } else {
                          setSelectedVariant([]);
                          setSelectedAttribute([]);
                          currentParams.delete("attributeEquipment");
                          currentParams.delete("variantEquipment");
                        }
                        router.replace(`${window.location.pathname}?${currentParams.toString()}`, { scroll: false });
                        onEquipmentChange?.(plan.id.toString(), !!plan.recurring_invoice);
                      }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <div className="w-5">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center
                            ${
                              isSelected
                                ? "bg-[#f59e0b] border-[#f59e0b]"
                                : "border-[#d1d5db]"
                            }`}
                          >
                            {isSelected && (
                              <FaCheck className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-[#111827] font-medium mb-3">
                        {(() => {
                          const displayPrice = isSelected ? (price ?? plan.list_price) : plan.list_price;
                          if (!displayPrice) return "Included";
                          return plan.recurring_invoice ? `$${displayPrice}/mo` : `$${displayPrice}`;
                        })()}
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
                          <li key={attrIndex} className="flex flex-col gap-2">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: attr.display_name,
                              }}
                            />
                            <ul className="space-y-2 text-sm text-[#374151]">
                              {attr.values.map((value, i) => {
                                const isSelected =
                                  selectedVariant[attrIndex]?.variant_id ===
                                  value.variant_id;
                                return (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2 ml-4 pr-3 cursor-pointer w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (selected) {
                                        setPrice(
                                          plan.list_price + value.price_extra,
                                        );
                                        handleSelect(
                                          attrIndex,
                                          value.id,
                                          value.variant_id,
                                          value.variant_name,
                                        );
                                        const finalPrice =
                                          plan.list_price + value.price_extra;

                                        params.set(
                                          "priceEquipment",
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
                }),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
