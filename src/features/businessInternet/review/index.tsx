"use client";

import { FaCalendarAlt } from "react-icons/fa";
import { redirect, useSearchParams, useRouter } from "next/navigation";

export default function ReviewPlan() {
  const search = useSearchParams();
  const params = new URLSearchParams(search);

  if (!search.get("homeCategory")) {
    redirect("/");
  } else if (
    !search.get("location") ||
    !search.get("services") ||
    !search.get("coordinates") ||
    !search.get("city")
  ) {
    redirect(`/business-internet?homeCategory=${search.get("homeCategory")}`);
  } else if (
    !search.get("childCategory") ||
    !search.get("childCategoryName") ||
    !search.get("product") ||
    !search.get("price") ||
    !search.get("productName")
  ) {
    redirect(
      `/business-internet/plan?homeCategory=${search.get("homeCategory")}&location=${search.get("location")}&services=${search.get("services")}&coordinates=${search.get("coordinates")}&city=${search.get("city")}`,
    );
  } else {
    const router = useRouter();

    const voucherSystem = JSON.parse(`${search.get("voucher")}`);

    const finalVoucher = voucherSystem ? voucherSystem : [];

    const businessVariant = JSON.parse(`${search.get("businessvariant")}`);

    const finalBusiness = businessVariant ? businessVariant : [];

    const totalVariantPrice = finalBusiness.reduce(
      (total: number, item: any) => total + Number(item?.variant_price || 0),
      0,
    );

    const optionalFeesRaw = search.get("optionalFees");
    const optionalFees = optionalFeesRaw ? JSON.parse(optionalFeesRaw) : [];
    const feesTotal = optionalFees.reduce(
      (sum: number, f: any) => sum + Number(f.price),
      0,
    );

    const totalPrice =
      Number(search.get("price") || 0) +
      Number(search.get("voucherPrice") || 0) +
      Number(search.get("priceEquipment") || 0) +
      totalVariantPrice +
      feesTotal;

    return (
      <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
        {/* Header */}
        <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[1.2] tracking-normal">
          Review Your Plan Before Checkout
        </h1>
        <p className="font-exo font-normal text-[12px] text-[14px] leading-[1] tracking-normal text-[#2C6176] mt-3">
          Everything looks good? Click Get Connected and we'll take care of the
          rest.
        </p>

        {/* Selection */}
        <div className="mt-6">
          <h2 className="font-exo font-bold text-[20px] leading-[1.2] tracking-normal text-[#111827]">
            Your selection
          </h2>

          <div className="mt-3 border-t border-[#E5E7EB] pt-4 space-y-3">
            {[
              ["Service", "Business Internet"],
              ["Connection Type", `${search.get("childCategoryName")}`],
              [
                "Package",
                `${search.get("productName")} $${Number(search.get("price"))}`,
              ],
              ...finalVoucher.map((item: any) => [
                "Extras",
                ` ${item.name} Voucher $${Number(item.price).toFixed(2)}`,
              ]),
              ...finalBusiness.map((item: any) => [
                "Business Extras",
                `${item.variant_name} - $${Number(item.variant_price).toFixed(2)}`,
              ]),
              ...((() => {
                const eId = search.get("equipmentId");
                const eName = search.get("productNameEquipment") || search.get("equipmentName");
                const ePrice = search.get("priceEquipment");
                const valid = (v: string | null) => !!v && v !== "null" && v !== "undefined";
                const hasPrice = valid(ePrice) && !isNaN(Number(ePrice)) && Number(ePrice) > 0;
                if (!valid(eId) || !valid(eName)) return [];
                return [["Equipment", hasPrice ? `${eName} - $${ePrice}` : `${eName} (Included)`]];
              })()),
              ...optionalFees.map((fee: any) => [
                "Fee",
                `${fee.name} - $${Number(fee.price).toFixed(2)}`,
              ]),
            ].map(([label, value], index) => (
              <div key={index} className="flex justify-between">
                <span className="font-exo font-normal text-[14px] leading-[1] tracking-normal text-[#2C6176]">
                  {label}
                </span>
                <span className="font-exo font-bold text-[14px] leading-[1] tracking-normal text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Card */}
        <div className="mt-6 rounded-xl bg-[#DCE7EB] px-5 py-4 flex justify-between items-center">
          <div>
            <p className="font-exo font-bold text-[14px] text-[#111827]">
              Total
            </p>
          </div>
          <div className="text-right">
            <p className="font-exo font-bold text-[20px] text-[#2F5D6C]">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Installation */}
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#F59E0B] bg-[#FFF7ED] px-4 py-4">
          <FaCalendarAlt className="text-[#9CA3AF]" />
          <p className="font-exo text-[14px] text-[#111827]">
            Estimated installation:{" "}
            <span className="font-bold text-[#F59E0B]">
              {search.get("childCategoryName")?.toLocaleLowerCase() === "fiber"
                ? "3-6 business days"
                : "24 - 48 hours"}
            </span>
          </p>
        </div>

        {/* Conditional UI */}
        <div className="my-6 h-[1px] bg-[#E5E7EB]" />
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <button
            onClick={() => {
              router.push(`/business-internet/plan?${params.toString()}`);
            }}
            className="rounded-lg border border-[#2F5D6C] px-6 py-4 font-exo text-[14px] text-[#2F5D6C] hover:bg-[#2F5D6C]/5"
          >
            Edit Plan
          </button>
          <button
            onClick={() => {
              router.push(`/business-internet/checkout?${params.toString()}`);
            }}
            className="rounded-lg bg-[#F59E0B] px-6 py-4 font-exo font-bold text-[14px] text-white hover:bg-[#D97706] flex items-center justify-center"
          >
            Get Connected →
          </button>
        </div>
      </div>
    );
  }
}
