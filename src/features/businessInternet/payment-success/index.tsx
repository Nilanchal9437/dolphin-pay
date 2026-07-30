"use client";

import { useState, useEffect, useRef } from "react";
import { getTransaction } from "@/src/features/payment-success/apis/getTransaction";
import { TransactionResponse } from "@/src/types";
import { useSearchParams } from "next/navigation";
import { FaCheckCircle } from "react-icons/fa";
import { BsStars } from "react-icons/bs";
import { getSalesOrderName } from "@/src/features/businessInternet/apis/getSalesOrder";

const PaymentSuccess = () => {
  const search = useSearchParams();
  const params = new URLSearchParams(search);
  const [paymentData, setPaymentData] = useState<TransactionResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const transactionID = search.get("transactionID");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [salesOrderName, setSalesOrderName] = useState<string | null>(null);

  const fetchSalesOrderName = async () => {
    try {
      const salesOrderId = search.get("salesOderId") || "";
      const { data } = await getSalesOrderName(salesOrderId);
      setSalesOrderName(data?.data || null);
    } catch (error) {
      console.error("Error fetching sales order name:", error);
    }
  };

  useEffect(() => {
    fetchSalesOrderName();
  }, []);

  useEffect(() => {
    if (!transactionID) return;

    // ✅ Prevent multiple intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const pollPaymentStatus = async () => {
      try {
        setLoading(true);

        const response = await getTransaction({
          transaction_id: transactionID,
        });

        if (response?.data?.status) {
          setPaymentData(response.data);
        }

        setLoading(false);

        // stop polling when completed
        if (
          response?.data &&
          response?.data?.status &&
          response?.data?.status !== "processing" &&
          response?.data?.status !== "pending"
        ) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          console.log("STOPPED");
        }
      } catch (error: any) {
        console.error("Polling error:", error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial call
    pollPaymentStatus();

    // Start polling
    intervalRef.current = setInterval(pollPaymentStatus, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transactionID]);

  // The order details for easy data passing
  const orderDetails = {
    reference: `${salesOrderName || "DLT-885435"}`,
    product: `${search.get("productName") || "Dolphin Home Fibre - Plus"}`,
    plan: `${search.get("plan") || "100Mbps"} Plan`,
    amountPaid: paymentData
      ? `${paymentData.amount} ${paymentData.currency}`
      : "$69.00 USD",
    paymentMethod: paymentData?.payment_method || "EcoCash",
  };

  const statusStyles = {
    completed: {
      bg: "",
      text: "",
      badge: "",
      message: "",
    },
    pending: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
      message: "Your payment is pending confirmation.",
    },
    processing: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      badge: "bg-yellow-100 text-yellow-700",
      message: "Your order is now being processed.",
    },
    failed: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
      message: "Your payment has failed.",
    },
    cancelled: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700",
      message: "Your payment has been cancelled.",
    },
  };

  const voucherSystem = JSON.parse(`${search.get("voucher")}`);

  const finalVoucher = voucherSystem ? voucherSystem : [];

  const businessVariant = JSON.parse(`${search.get("businessvariant")}`);

  const finalBusiness = businessVariant ? businessVariant : [];

  const totalVariantPrice = finalBusiness.reduce(
    (total: number, item: any) => total + Number(item?.variant_price || 0),
    0,
  );

  const totalPrice =
    Number(search.get("price") || 0) +
    Number(search.get("voucherPrice") || 0) +
    Number(search.get("priceEquipment") || 0) +
    totalVariantPrice;

  return (
    <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
      {/* Header */}
      <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[1.2] tracking-normal">
        Review Your Business Plan
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
            [
              "Equipment",
              search.get("productNameEquipment")
                ? `${search.get("equipmentName")} ${search.get("productNameEquipment")} - $${search.get("priceEquipment")}`
                : `${search.get("equipmentName")} ${search.get("productNameEquipment")} (Included)`,
            ],
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
          <p className="font-exo font-bold text-[14px] text-[#111827]">Total</p>
        </div>
        <div className="text-right">
          <p className="font-exo font-bold text-[20px] text-[#2F5D6C]">
            ${totalPrice}.00
          </p>
        </div>
      </div>

      {loading ? (
        <PaymentStatusSkeleton />
      ) : (
        <div className="mt-8 text-center">
          {paymentData?.status === "completed" ? (
            <div className="text-8xl text-[#f59e0b]"><BsStars /></div>
          ) : (
            ""
          )}

          <h3 className="mt-3 font-exo font-bold text-[20px] leading-[1.2] tracking-normal text-center text-[#111827]">
            {paymentData?.status !== "completed"
              ? paymentData?.status === "pending" ||
                paymentData?.status === "processing"
                ? "Your order is currently being processed"
                : `Your order could not be processed.`
              : "You're almost connected!"}
          </h3>

          <p className="mt-2 font-exo font-normal text-[16px] leading-[1.5] tracking-normal text-center mx-auto text-[#2C6176]">
            {paymentData?.status === "completed"
              ? "Your order has been received"
              : ""}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#DCE7EB] px-5 py-3">
            <FaCheckCircle className="text-[#2F5D6C]" />
            <span className="font-exo font-bold text-[16px] text-[#2F5D6C]">
              {orderDetails.reference}
            </span>
          </div>

          <p className="my-8 font-exo text-[12px] text-[#2C6176]">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[paymentData?.status ?? ("pending" as keyof typeof statusStyles)].badge}`}
            >
              {paymentData?.status === "completed"
                ? "A confirmation has been sent to your email."
                : `Transaction failed! Please check your payment details and try again.`}
            </span>
          </p>

          {/* Back to Home Button */}
          {paymentData?.status === "failed" ||
          paymentData?.status === "cancelled" ? (
            <a href="/" className="w-full mt-2">
              <button className="px-6 py-3 bg-[#1f4d5a] text-white rounded-lg">
                Back to Home
              </button>
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
};

const PaymentStatusSkeleton = () => {
  return (
    <div className="mt-8 text-center animate-pulse">
      {/* Emoji / Icon */}
      <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto" />

      {/* Heading */}
      <div className="mt-4 h-6 w-64 bg-gray-200 rounded-md mx-auto" />

      {/* Description */}
      <div className="mt-3 space-y-2 flex flex-col items-center">
        <div className="h-4 w-80 bg-gray-200 rounded-md" />
        <div className="h-4 w-64 bg-gray-200 rounded-md" />
      </div>

      {/* Button */}
      <div className="flex justify-center mt-6">
        <div className="h-12 w-40 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
};

export default PaymentSuccess;
