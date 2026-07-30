"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ecocashPaymentInitiate } from "@/src/features/ecocash/apis/paymentInitiate";
import { getTransaction } from "@/src/features/payment-success/apis/getTransaction";

export default function Ecocash() {
  const router = useRouter();
  const search = useSearchParams();
  const params = new URLSearchParams(search);

  const getSuccessPath = () => {
    const orderType = search.get("orderType");
    if (orderType === "home" || orderType === "airtime") {
      return `/payment-success/echocash?${params.toString()}`;
    }
    return `/business-internet/payment-success/echocash?${params.toString()}`;
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
    const { status, data } = await ecocashPaymentInitiate({
      customer_name: `${search.get("customerName")}`,
      account_number: `${search.get("accountNumber")}`,
      phone: `${search.get("ecocashNumber")}`,
      amount: computeTotal(),
      param: `${params.toString()}`,
    });

    if (status && data) {
      params.set("transactionID", data?.transaction_id);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
      if (search.get("orderType") === "home" || search.get("orderType") === "airtime") {
        router.push(`/payment-success/echocash?${params.toString()}`);
      } else {
        router.push(
          `/business-internet/payment-success/echocash?${params.toString()}`,
        );
      }
    }
  };

  useEffect(() => {
    const existingTxId = search.get("transactionID");

    if (!existingTxId) {
      InitiatePayment();
      return;
    }

    getTransaction({ transaction_id: existingTxId })
      .then(({ data }) => {
        const txStatus = data?.status;
        if (
          txStatus === "completed" ||
          txStatus === "processing" ||
          txStatus === "pending"
        ) {
          router.replace(getSuccessPath());
        } else {
          params.delete("transactionID");
          InitiatePayment();
        }
      })
      .catch(() => {
        params.delete("transactionID");
        InitiatePayment();
      });
  }, []);

  return (
    <div className="flex flex-col min-h-full justify-center items-center mx-5">
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
    </div>
  );
}
