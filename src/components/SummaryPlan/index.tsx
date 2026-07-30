"use client";

import { useState, useMemo } from "react";
import { SummaryItem, PricingItem } from "./type";
import {
  IoShieldOutline,
  IoLockClosedOutline,
  IoCallOutline,
} from "react-icons/io5";
import { FiDollarSign } from "react-icons/fi";
import { CiShoppingCart } from "react-icons/ci";
import { useSearchParams } from "next/navigation";
interface PlanSummaryProps {
  title?: string;
  items: SummaryItem[];
  pricing: PricingItem[];
  currency?: string;
}

export default function PlanSummary({
  title = "Your Plan Summary",
  items,
  pricing,
  currency = "$",
}: PlanSummaryProps) {
  const [open, setOpen] = useState(true);
  const search = useSearchParams();

  const hasInstallationFee = useMemo(() => {
    const fees = search.get("optionalFees");
    if (!fees) return false;
    try {
      return JSON.parse(fees).some((f: any) =>
        f.name?.toLowerCase().includes("installation fee"),
      );
    } catch {
      return false;
    }
  }, [search]);

  const total = useMemo(() => {
    return pricing.reduce((sum, item) => {
      if (item.type === "price" || item.type === "fee") {
        const v = Number(item.value);
        return sum + (isNaN(v) ? 0 : v);
      }
      return sum;
    }, 0);
  }, [pricing]);

  const filteredPricing = pricing.filter(item => item.type !== "Included");
  const pricingLength = filteredPricing.length - 1;

  return (
    <div className="w-full bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-teal-800 text-white px-5 py-4 font-bold text-[20px] leading-[120%] tracking-normal">
        {title}
      </div>

      {items.length === 0 && pricing.length === 0 ? (
        <div className="flex flex-col justify-center items-center my-5">
          <CiShoppingCart size={100} strokeWidth={0.2} color="#DCDCDC" />
          <p className="mt-1 max-w-[80%] font-normal text-md leading-none tracking-normal text-center text-[#2C6176]">
            Your selections will appear here as you build your plan.
          </p>
        </div>
      ) : (
        <>
          {/* Items */}
          <div className="p-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-[#DCDCDC] pb-4"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.icon}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>

                {item.value && (
                  <p className="font-semibold text-teal-800">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          {pricing.length === 0 ? null : (
            <div className="px-4 pb-4">
              <button
                onClick={() => setOpen(!open)}
                className="w-full bg-gray-100 rounded-lg px-4 py-3 flex justify-between items-center font-medium"
              >
                Pricing breakdown
                <span>{open ? "▴" : "▾"}</span>
              </button>

              {open && (
                <div className="mt-4 space-y-2 text-sm">
                  {filteredPricing.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col justify-between gap-2"
                    >
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.type === "fee" ? item.label : `${item.label} Plan`}
                        </span>
                        <span>
                          {isNaN(Number(item.value)) || item.value === 0 ? (
                            <span className="px-2 bg-[#0CAB461A] text-[#0CAB46]">Included</span>
                          ) : (
                            <>{currency}{item.value}</>
                          )}
                        </span>
                      </div>
                      {pricingLength === index && !hasInstallationFee && (
                        <div className="flex justify-between">
                          <span>Installation</span>
                          <span className="px-2 bg-[#0CAB461A] text-[#0CAB46]">
                            Free
                          </span>
                        </div>
                      )}
                      {pricingLength === index && (
                        <div className="flex justify-between">
                          <span>Est. installation</span>
                          <span className="text-[#F2A413]">{search.get("childCategoryName")?.toLocaleLowerCase() === "fiber" ? "3-6 business days" : "24 - 48 hours" }</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="mt-4 bg-gray-100 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">Total Amount</p>
                  <p className="text-xs text-gray-500">
                    incl. all selected extras
                  </p>
                </div>

                <p className="text-xl font-bold text-teal-800">
                  {currency}
                  {total}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Features */}
      <div className="px-5 pb-5 space-y-2 text-sm text-gray-600 border-t-2 border-[#DCDCDC] pt-4">
        <div className="flex flex-row gap-2 items-center">
          <IoShieldOutline className="text-[#F2A413]" size={20} />
          <p>Free installation on selected packages</p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <FiDollarSign className="text-[#F2A413]" size={20} />
          <p>No hidden fees. Transparent pricing.</p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <IoLockClosedOutline className="text-[#F2A413]" size={20} />
          <p>Secure checkout</p>
        </div>
        <div className="flex flex-row gap-2 items-center">
          <IoCallOutline className="text-[#F2A413]" size={20} />
          <p>Live support available</p>
        </div>
      </div>
    </div>
  );
}
