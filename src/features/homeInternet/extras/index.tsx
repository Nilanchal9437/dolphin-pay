"use client";

import Image from "next/image";
import { useState, ReactNode, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { FiSmartphone } from "react-icons/fi";
import cn from "classnames";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import { Voucher } from "@/src/features/homeInternet/types/type";
import { getVouchers } from "@/src/features/homeInternet/apis/getVouchers";
import { reserveVoucher } from "@/src/features/homeInternet/apis/reserveVoucher";

interface SectionProps {
  title: string;
  children: ReactNode;
}

interface CardProps {
  item: Voucher;
  selected: { id: string; price: string }[];
  onClick: (id: string, price: string) => void;
}

export default function Extras() {
  const search = useSearchParams();

  if (!search.get("homeCategory")) {
    redirect("/");
  } else if (
    !search.get("location") ||
    !search.get("services") ||
    !search.get("coordinates") ||
    !search.get("city")
  ) {
    redirect(`/home-internet?homeCategory=${search.get("homeCategory")}`);
  } else if (
    !search.get("childCategory") ||
    !search.get("childCategoryName") ||
    !search.get("product") ||
    !search.get("price") ||
    !search.get("productName")
  ) {
    redirect(
      `/home-internet/plan?homeCategory=${search.get("homeCategory")}&location=${search.get("location")}&services=${search.get("services")}&coordinates=${search.get("coordinates")}&city=${search.get("city")}`,
    );
  } else {
    const [streaming, setStreaming] = useState<boolean>(true);
    const [dataBoost, setDataBoost] = useState<boolean>(false);
    const [selectedVouchers, setSelectedVouchers] = useState<
      { id: string; price: string; name: string }[]
    >([]);
    const [bundleActive, setBundleActive] = useState<boolean>(false);
    const [mobilePlan, setMobilePlan] = useState<string>("standard");
    const [loading, setLoading] = useState(true);
    const [groupedVouchers, setGroupedVouchers] = useState<Record<string, Voucher[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const toggleVoucher = (
      id: string,
      price: string,
      name: string,
      image: string,
      group: string,
    ) => {
      setSelectedVouchers((prev) =>
        prev.some((v) => v.id === id)
          ? prev.filter((v) => v.id !== id)
          : [...prev, { id, price, name, image, group }],
      );
    };

    const router = useRouter();
    const searchParams = Object.fromEntries(search.entries());
    const params = new URLSearchParams(searchParams);

    const getCategories = async () => {
      try {
        setLoading(true);
        const res = await getVouchers();
        if (res.status && res.data) {
          const grouped = res.data.reduce<Record<string, Voucher[]>>((acc, item) => {
            const key = item.metadata.group.toLowerCase();
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {});
          setGroupedVouchers(grouped);
          if (search.get("voucher")) {
            setSelectedVouchers(JSON.parse(`${search.get("voucher")}` || "[]"));
          }
        } else {
          setGroupedVouchers({});
        }
      } catch (error) {
        console.error("Error fetching vouchers:", error);
        setGroupedVouchers({});
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      getCategories();
    }, []);

    const onSubmit = async () => {
      try {
        setIsLoading(true);

        const vouchers = JSON.parse(search.get("voucher") || "[]");

        const allProducts = Object.values(groupedVouchers).flat();

        const updatedVouchers = await Promise.all(
          vouchers.map(async (voucher: any) => {
            // Skip API call if reservation_id already exists
            if (voucher.reservation_id) {
              return voucher;
            }

            const product = allProducts.find((item) => item.id === voucher.id);

            if (!product) {
              return voucher;
            }

            const usdPrice = product.prices.find(
              (p) => p.currency.toLowerCase() === "usd",
            );

            try {
              const response: any = await reserveVoucher(
                product.id,
                usdPrice?.currency ?? "",
                `${usdPrice?.value ?? ""}`,
              );

              return {
                ...voucher,
                reservation_id: response?.data?.data?.reservation_id ?? null,
              };
            } catch (error) {
              console.error(`Failed to reserve voucher ${voucher.id}`, error);

              return {
                ...voucher,
                reservation_id: null,
              };
            }
          }),
        );

        params.set("voucher", JSON.stringify(updatedVouchers));

        const hasFailed = updatedVouchers.some(
          (voucher: any) => !voucher.reservation_id,
        );

        if (!hasFailed) {
          router.push(`/home-internet/equipment?${params.toString()}`);
        }
      } catch (error) {
        console.error("Reserve voucher error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
        <h1 className="font-exo font-bold  text-[24px] lg:text-[34px] leading-[1.2] tracking-normal mb-2">
          Enhance Your Plan
        </h1>
        <p className="font-exo font-normal  text-[12px] lg:text-[14px] leading-[1] tracking-normal text-[#2C6176] mb-6">
          Optional add-ons. Each selection updates your monthly and once-off
          totals instantly.
        </p>

        {/* Top Addons */}
        {/* <div className="space-y-4 mb-6">
          <PlanCard
            image="/extra/Voucher.png"
            title="Streaming Voucher"
            description="Enjoy your favourite content with a monthly streaming credit."
            selected={streaming}
            onClick={() => setStreaming(!streaming)}
            price="$9/mo"
          />
          <PlanCard
            image="/extra/Failover.png"
            title="Extra Data Boost"
            description="Increase your monthly data allowance by 50GB."
            selected={dataBoost}
            onClick={() => setDataBoost(!dataBoost)}
            price="$15/mo"
          />
        </div> */}

        {loading ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DCDCDC]">
              <div className="w-1 h-4 bg-[#f59e0b]" />
              <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((_, index) => <CardSkeleton key={index} />)}
            </div>
          </div>
        ) : Object.keys(groupedVouchers).length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d1d5db] bg-[#f9fafb] p-8 flex flex-col items-center text-center mb-6">
            <p className="font-exo font-bold text-[16px] text-[#111827]">Coming Soon</p>
            <p className="text-sm text-[#6b7280] mt-1">Voucher add-ons will be available here soon.</p>
          </div>
        ) : (
          Object.entries(groupedVouchers).map(([group, vouchers]) => {
            const title = (vouchers[0]?.metadata?.group_label ?? group).toUpperCase();
            return (
              <Section key={group} title={title}>
                {vouchers.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    selected={selectedVouchers}
                    onClick={() => {
                      const currentSearchParams = Object.fromEntries(search.entries());
                      toggleVoucher(
                        item.id,
                        `${item.prices.find((p) => p.currency.toLowerCase() === "usd")?.value}`,
                        item.name,
                        item.metadata.logo_url,
                        item.metadata.group,
                      );
                      const voucher = selectedVouchers.some((v) => v.id === item.id)
                        ? selectedVouchers.filter((v) => v.id !== item.id)
                        : [
                            ...selectedVouchers,
                            {
                              id: item.id,
                              price: `${item.prices.find((p) => p.currency.toLowerCase() === "usd")?.value}`,
                              name: item.name,
                              image: item.metadata.logo_url,
                              group: item.metadata.group,
                            },
                          ];
                      const params = new URLSearchParams(currentSearchParams);
                      params.set("voucher", JSON.stringify(voucher));
                      const totalPrice = voucher.reduce((sum, v) => sum + parseInt(v.price), 0);
                      params.set("voucherPrice", `${totalPrice}`);
                      window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
                    }}
                  />
                ))}
              </Section>
            );
          })
        )}

        {/* Bundle */}
        {/* <div className="border-2 border-dashed border-[#f59e0b] rounded-xl p-5 mt-6 bg-[#fff7ed]">
          <div
            className={cn(
              "flex flex-col md:flex-row justify-between items-center gap-4",
              {
                "mb-4 pb-4 border-b border-[#f59e0b]": bundleActive,
              },
            )}
          >
            <div className="flex gap-4">
              <div className="bg-[#FDECCC] rounded-lg py-4 px-2 text-2xl">
                <FiSmartphone />
              </div>
              <div className="flex-1">
                <p className="font-exo font-bold text-[20px] leading-[1.2] tracking-normal">
                  Bundle & Save 10%
                </p>
                <p className="text-sm text-[#6b7280]">
                  Add a Mobile Plan and save 10% on your Internet package
                  monthly price.
                </p>
              </div>
            </div>

            <button
              onClick={() => setBundleActive(!bundleActive)}
              disabled={true}
              className={`px-4 w-full md:w-[200px] py-2 rounded-lg border ${
                bundleActive
                  ? "bg-[#ecfdf5] text-[#065f46] border-[#10b981]"
                  : "bg-[#f59e0b] text-white border-[#f59e0b] opacity-20"
              }`}
            >
              {bundleActive ? <><FaCheck className="inline mr-1" />Bundle Active</> : "Add Mobile Plan"}
            </button>
          </div>

          {bundleActive && (
            <div className="space-y-3">
              <p className="font-exo font-bold text-[14px] leading-[1] tracking-normal">
                Select Mobile Plan
              </p>
              {["basic", "standard", "global"].map((plan) => {
                const isActive = mobilePlan === plan;

                const data = {
                  basic: {
                    title: "Basic Mobile",
                    desc: "3GB Data · Calls & SMS · Zimbabwe & SA",
                    price: "$19/mo",
                  },
                  standard: {
                    title: "Standard Mobile",
                    desc: "8GB Data · Calls & SMS · Zimbabwe & SA",
                    price: "$29/mo",
                  },
                  global: {
                    title: "Global eSIM",
                    desc: "10GB Data · 100+ countries",
                    price: "$39/mo",
                  },
                }[plan as "basic" | "standard" | "global"];

                return (
                  <div
                    key={plan}
                    onClick={() => setMobilePlan(plan)}
                    className={`flex justify-between items-center p-4 rounded-xl border cursor-pointer ${
                      isActive
                        ? "border-2 border-[#f59e0b] bg-[#fff7ed]"
                        : "border-[#e5e7eb] bg-[#FFFFFF]"
                    }`}
                  >
                    <div>
                      <p className="font-exo font-bold text-[16px] leading-[1.5] tracking-normal">
                        {data.title}
                      </p>
                      <p className="text-sm text-[#6b7280]">{data.desc}</p>
                      <span className="lg:hidden block font-exo font-bold text-[16px] leading-[1.2] tracking-normal mt-3 text-[#2C6176]">
                        {data.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden lg:block font-exo font-bold text-[16px] leading-[1.2] tracking-normal text-right text-[#2C6176]">
                        {data.price}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isActive
                            ? "bg-[#f59e0b] border-[#f59e0b]"
                            : "border-[#d1d5db]"
                        }`}
                      >
                        {isActive && <FaCheck className="text-white text-xs" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-3 p-3 rounded-lg bg-[#ecfdf5] border border-[#10b981] text-[#065f46] font-[Exo] font-bold text-[14px] leading-[100%] tracking-[0%] flex items-center gap-2">
                <FaRegCheckCircle className="hidden sm:flex" />
                <FaRegCheckCircle size={30} className="sm:hidden flex" /> Bundle
                savings applied. You're saving 10% on your Internet package.
              </div>
            </div>
          )}
        </div> */}

        {/* Footer */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <button
            className="px-6 py-3 border-3 border-[#1f4d5a] rounded-lg"
            onClick={() =>
              router.push(
                `/home-internet/plan?homeCategory=${search.get("homeCategory")}&location=${search.get("location")}&childCategory=${search.get("childCategory")}&childCategoryName=${search.get("childCategoryName")}&product=${search.get("product")}&price=${search.get("price")}&attribute=${search.get("attribute")}&services=${search.get("services")}&coordinates=${search.get("coordinates")}&city=${search.get("city")}`,
              )
            }
          >
            Back
          </button>
          <button
            className="px-6 py-3 bg-[#1f4d5a] text-white rounded-lg flex items-center justify-center"
            onClick={() => {
              onSubmit();
            }}
          >
            Continue → &nbsp;&nbsp;
            {isLoading ? (
              <div className="flex items-center justify-center w-fit h-fit rounded-full">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
              </div>
            ) : null}
          </button>
        </div>
      </div>
    );
  }
}

const CardSkeleton = () => {
  return (
    <div className="relative border rounded-xl p-4 border-[#e5e7eb] animate-pulse">
      {/* Checkbox */}
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full border border-[#d1d5db]" />

      {/* Image Skeleton */}
      <div className="h-16 bg-[#f3f4f6] rounded-lg mb-3 flex items-center justify-center">
        <div className="w-12 h-12 bg-gray-200 rounded-md" />
      </div>

      {/* Title Skeleton */}
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />

      {/* Price Skeleton */}
      <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto" />
    </div>
  );
};

function Card({ item, selected, onClick }: CardProps) {
  const active = selected.some((v) => v.id === item.id);

  const isOutOfStock =
    item.available_count === 0 ||
    !item.prices.find((p) => p.currency.toLowerCase() === "usd")?.value;

  return (
    <div
      onClick={() => {
        if (!isOutOfStock)
          onClick(
            item.id,
            `${item.prices.find((p) => p.currency.toLowerCase() === "usd")?.value}`,
          );
      }}
      className={cn("relative border rounded-xl p-4 transition", {
        "cursor-not-allowed bg-gray-100 border-gray-200 opacity-60":
          isOutOfStock,
        "cursor-pointer border-2 border-[#f59e0b] bg-[#fff7ed]":
          !isOutOfStock && active,
        "cursor-pointer border-[#e5e7eb]": !isOutOfStock && !active,
      })}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center",
          {
            "border-gray-300 bg-gray-200": isOutOfStock,
            "bg-[#f59e0b] border-[#f59e0b]": !isOutOfStock && active,
            "border-[#d1d5db]": !isOutOfStock && !active,
          },
        )}
      >
        {!isOutOfStock && active && <FaCheck className="text-white text-xs" />}
      </div>

      {/* Image */}
      <div className="h-16 bg-[#f3f4f6] rounded-lg mb-3 flex items-center justify-center">
        <Image
          src={item.metadata.logo_url}
          alt={item.metadata.description}
          height={80}
          width={80}
          className={cn("h-12 w-20", { grayscale: isOutOfStock })}
        />
      </div>

      {/* Name */}
      <p className="font-exo font-bold text-[14px] text-center mb-2">
        {item.name}
      </p>

      {/* Price */}
      <p className="font-exo font-bold text-[16px] text-center text-[#2C6176]">
        $
        {Number(
          item.prices.find((p) => p.currency.toLowerCase() === "usd")?.value,
        ).toFixed(2)}
      </p>

      {/* Optional label */}
      {isOutOfStock && (
        <p className="text-xs text-center text-red-500 mt-1">Out of Stock</p>
      )}
    </div>
  );
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DCDCDC]">
        <div className="w-1 h-4 bg-[#f59e0b]" />
        <p className="text-xs tracking-widest text-[#6b7280]">{title}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{children}</div>
    </div>
  );
}
