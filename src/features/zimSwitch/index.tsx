"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zimswitchPaymentInitiate } from "@/src/features/zimSwitch/apis/paymentInitiate";
import { getTransaction } from "@/src/features/payment-success/apis/getTransaction";

export default function ZimSwitch() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(true);
  const params = new URLSearchParams(search);

  const getSuccessPath = () => {
    const orderType = search.get("orderType");
    if (orderType === "home" || orderType === "airtime") {
      return `/payment-success/zimswitch?${params.toString()}`;
    }
    return `/business-internet/payment-success/zimswitch?${params.toString()}`;
  };

  const computeTotal = () => {
    const price = Number(search.get("price") || 0);
    const voucherPrice = Number(search.get("voucherPrice") || 0);
    const priceEquipment = Number(search.get("priceEquipment") || 0);
    const optionalFees = (() => {
      try { return JSON.parse(search.get("optionalFees") || "[]"); } catch { return []; }
    })();
    const feesTotal = optionalFees.reduce((sum: number, f: any) => sum + Number(f.price), 0);
    const businessVariant = (() => {
      try { return JSON.parse(search.get("businessvariant") || "[]"); } catch { return []; }
    })();
    const variantTotal = businessVariant.reduce((sum: number, v: any) => sum + Number(v.variant_price || 0), 0);
    return price + voucherPrice + priceEquipment + feesTotal + variantTotal;
  };

  const InitiatePayment = async () => {
    const { status, data } = await zimswitchPaymentInitiate({
      customer_name: `${search.get("customerName")}`,
      account_number: `${search.get("accountNumber")}`,
      phone: `${search.get("customerPhone")}`,
      customer_email: `${search.get("customerEmail")}`,
      currency: "USD",
      amount: computeTotal(),
      param: `${params.toString()}`,
    });

    if (status && data?.widget_url) {
      params.set("transactionID", data?.transaction_id);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
      // 🔥 IMPORTANT: delay script so form is mounted
      setTimeout(() => {
        try {
          const existing = document.getElementById("zimswitch-widget");
          if (existing) {
            existing.remove();
          }

          // 🔥 IMPORTANT: define before script loads
          (window as any).wpwlOptions = {
            onReady: function () {
              console.log("Widget ready ✅");
            },
            onError: function (e: any) {
              console.error("Widget error ❌", e);
            },
          };

          const script = document.createElement("script");
          script.src = data.widget_url;
          script.async = true;
          script.id = "zimswitch-widget";

          script.onload = () => {
            console.log("Script loaded ✅");

            // 🔥 FORCE RE-INIT (important in React)
            const forms = document.querySelectorAll(".paymentWidgets");
            if (forms.length === 0) {
              console.error("Form not found ❌");
            } else {
              console.log("Form found ✅");
            }
          };

          document.body.appendChild(script);
        } catch (err) {
          console.log(err);
        } finally {
          setLoading(false);
        }
      }, 100); // small delay ensures DOM is ready
    }
  };

  useEffect(() => {
    const existingTxId = search.get("transactionID");

    if (!existingTxId) {
      InitiatePayment();
    } else {
      getTransaction({ transaction_id: existingTxId })
        .then(({ data }) => {
          const txStatus = data?.status;
          if (txStatus === "completed" || txStatus === "processing") {
            router.replace(getSuccessPath());
          } else {
            // pending = card not entered, failed/cancelled = retrigger
            params.delete("transactionID");
            InitiatePayment();
          }
        })
        .catch(() => {
          params.delete("transactionID");
          InitiatePayment();
        });
    }

    return () => {
      const existing = document.getElementById("zimswitch-widget");
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-full justify-center items-center mx-5">
      {/* Loader */}
      {loading && (
        <>
          <div className="flex items-center justify-center w-fit h-fit rounded-full p-5 bg-[#E6F2F5] mt-[20vh]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
          </div>
          <div className="mt-5">
            <h5 className="font-exo font-bold text-[20px] text-center">
              Processing Payment...
            </h5>
            <p className="max-w-md text-center mt-4 text-[#6B7280]">
              Please wait while we securely process your payment.
            </p>
          </div>
        </>
      )}

      {/* 🔥 FORM MUST ALWAYS EXIST */}
      <form
        action="/result"
        className="paymentWidgets"
        data-brands="PRIVATE_LABEL"
      />
    </div>
  );
}
