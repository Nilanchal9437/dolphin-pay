"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import { BsCurrencyDollar } from "react-icons/bs";
import { IoLockClosedOutline } from "react-icons/io5";
import { RxPerson } from "react-icons/rx";
import { useRouter, useSearchParams } from "next/navigation";
import cn from "classnames";
import { createCustomer } from "@/src/features/businessInternet/apis/createCustomer";
import { generateSaleOrder } from "@/src/features/businessInternet/apis/salesOrderGeneration";
import { getCustomerAccountNumber } from "@/src/features/businessInternet/apis/getCustomerAccount";
import { getVoucherProduct } from "@/src/features/businessInternet/apis/getVoucherProduct";
import { getTagId } from "@/src/features/businessInternet/apis/getTagId";
import { validatePurchase } from "@/src/features/businessInternet/apis/validatePurchase";

export default function SecureCheckout() {
  const [showModal, setShowModal] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const search = useSearchParams();
  const params = new URLSearchParams(search);
  const [submitLoader, setSubmitLoader] = useState<boolean>(false);
  const [ecocashNumber, setEcocashNumber] = useState<string>("");

  const generateCustomer = async (
    email: string,
    name: string,
    phone: string,
  ) => {
    setSubmitLoader(true);
    const coordinates = JSON.parse(`${search.get("coordinates")}`);

    const body = {
      partner_latitude: coordinates?.lat,
      partner_longitude: coordinates?.lng,
      email: email,
      street: `${search.get("location")}`,
      city: `${search.get("city")}`,
      country_code: "ZW",
      name: name,
      phone: phone,
      is_company: true,
    };

    const tagId = await getTagId();

    const response = await createCustomer(body);

    if (response.status && response.data) {
      params.set("customerId", `${response.data[0]}`);
      params.set("customerName", `${name}`);
      params.set("customerEmail", `${email}`);
      params.set("customerPhone", `${phone}`);

      const accountResponse = await getCustomerAccountNumber({
        customer_id: `${response.data[0]}`,
      });

      if (accountResponse.status && accountResponse.data) {
        params.set("accountNumber", `${accountResponse.data.account_numbers}`);
      }

      const orderLines: any[] = [];

      const voucherResponse = await getVoucherProduct();

      if (
        voucherResponse.status &&
        voucherResponse.data &&
        search.get("voucher")
      ) {
        const voucher = JSON.parse(`${search.get("voucher")}`);
        const finalVoucher = voucher ? voucher : [];

        const validatePurchasePromises = finalVoucher.map((item: any) => {
          return validatePurchase(item.reservation_id);
        });

        const results: any = await Promise.allSettled(validatePurchasePromises);

        const updatedVouchers = finalVoucher.map(
          (voucher: any, index: number) => {
            return {
              ...voucher,
              order_ref:
                results[index]?.status === "fulfilled" &&
                results[index].value?.data?.data?.order_ref
                  ? results[index]?.value.data?.data?.order_ref
                  : null,
            };
          },
        );

        params.set("voucher", JSON.stringify(updatedVouchers));

        finalVoucher.map((items: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(
                `${voucherResponse?.data ? voucherResponse?.data?.id : 0}`,
              ),
              product_uom_qty: 1,
              price_unit: Number(`${items.price}`).toFixed(2),
              name: `${items.name}`,
            },
          ]),
        );
      }

      if (search.get("variant")) {
        const variant = JSON.parse(`${search.get("variant")}`);
        const finalVariant = variant ? variant : [];
        finalVariant.map((item: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(`${item.variant_id}`),
              product_uom_qty: 1,
              price_unit: Number(`${search.get("price")}`),
              name: `${item.variant_name}`,
            },
          ]),
        );
      }

      if (search.get("businessvariant")) {
        const businessVariant = JSON.parse(`${search.get("businessvariant")}`);
        const finalBusinessVariant = businessVariant ? businessVariant : [];
        finalBusinessVariant.map((item: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(`${item.variant_id}`),
              product_uom_qty: 1,
              price_unit: Number(`${item.variant_price}`),
              name: `${item.variant_name}`,
            },
          ]),
        );
      }

      if (
        search.get("productEquipment") &&
        search.get("priceEquipment") &&
        search.get("productNameEquipment")
      ) {
        orderLines.push([
          0,
          0,
          {
            product_id: Number(`${search.get("productEquipment")}`),
            product_uom_qty: 1,
            price_unit: Number(`${search.get("priceEquipment")}`),
            name: `${search.get("productNameEquipment")}`,
          },
        ]);
      }

      if (
        search.get("product") &&
        search.get("price") &&
        search.get("productName")
      ) {
        orderLines.push([
          0,
          0,
          {
            product_id: Number(`${search.get("product")}`),
            product_uom_qty: 1,
            price_unit: Number(`${search.get("price")}`),
            name: `${search.get("productName")}`,
          },
        ]);
      }

      if (search.get("variantEquipment")) {
        const variant = JSON.parse(`${search.get("variantEquipment")}`);
        const finalVariant = variant ? variant : [];
        finalVariant.map((item: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(`${item.variant_id}`),
              product_uom_qty: 1,
              price_unit: Number(`${search.get("price")}`),
              name: `${item.variant_name}`,
            },
          ]),
        );
      }

      if (search.get("optionalFees")) {
        const fees = JSON.parse(search.get("optionalFees") || "[]");
        fees.forEach((fee: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(fee.variantId),
              product_uom_qty: 1,
              price_unit: Number(fee.price),
              name: fee.name,
            },
          ]),
        );
      }

      const planId = search.get("planId")
        ? Number(`${search.get("planId")}`)
        : undefined;

      let body = {};

      if (planId) {
        body = {
          companyId: 1,
          partnerId: Number(`${response.data[0]}`),
          partnerInvoiceId: Number(`${response.data[0]}`),
          tag_ids: tagId.data ? tagId.data.map((id: any) => id?.id) : [],
          partnerShippingId: Number(`${response.data[0]}`),
          order_line: orderLines,
          plan_id: 1,
        };
      } else {
        body = {
          companyId: 1,
          partnerId: Number(`${response.data[0]}`),
          partnerInvoiceId: Number(`${response.data[0]}`),
          tag_ids: tagId.data ? tagId.data.map((id: any) => id?.id) : [],
          partnerShippingId: Number(`${response.data[0]}`),
          order_line: orderLines,
        };
      }

      if (orderLines.length > 0) {
        const orderResponse = await generateSaleOrder(body as any);

        if (orderResponse.status && orderResponse.data) {
          params.set("salesOderId", `${orderResponse.data[0]}`);
          params.set("orderType", `business`);
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}?${params.toString()}`,
          );
          setShowModal(true);
          setSubmitLoader(false);
        }
      }
    }
  };

  type FormData = {
    fullName: string;
    email: string;
    phone: string;
  };

  type FormErrors = {
    fullName?: string;
    email?: string;
    phone?: string;
    ecocashNumber?: string;
  };

  const [form, setForm] = useState<FormData>({
    fullName: ``,
    email: ``,
    phone: ``,
  });

  useEffect(() => {
    if (
      search.get("customerName") &&
      search.get("customerEmail") &&
      search.get("customerPhone")
    ) {
      setForm({
        fullName: `${search.get("customerName")}`,
        email: `${search.get("customerEmail")}`,
        phone: `${search.get("customerPhone")}`,
      });
    }
  }, [search]);

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // clear error on typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return undefined;
    if (email.length > 254) return "Please enter a valid email address";
    if (/\s/.test(email)) return "Please enter a valid email address";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const handleEmailBlur = () => {
    const error = validateEmail(form.email);
    setErrors((prev) => ({
      ...prev,
      email: error || "",
    }));
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) return undefined;

    const trimmed = phone.trim();

    // Only allow digits, spaces, and an optional leading +
    if (!/^\+?[\d\s]+$/.test(trimmed)) {
      return "Please enter a valid phone number";
    }

    const cleaned = trimmed.replace(/\s/g, "").replace(/^\+/, "");

    // Zimbabwe formats:
    // 0776797359
    // 263776797359
    const zwRegex = /^(07\d{8}|2637\d{8})$/;

    if (!zwRegex.test(cleaned)) {
      return "Please enter a valid phone number";
    }

    return undefined;
  };

  const handlePhoneBlur = () => {
    const error = validatePhone(form.phone);
    setErrors((prev) => ({
      ...prev,
      phone: error || "",
    }));
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (selectedMethod === "EcoCash") {
      if (!ecocashNumber.trim()) {
        newErrors.ecocashNumber = "Echocash Number is required!";
      }
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else {
      const trimmed = form.fullName.trim();
      if (trimmed.length < 2) {
        newErrors.fullName = "Please enter a valid name";
      }
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      form.email.length > 254 ||
      /\s/.test(form.email) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    const phone = form.phone.trim();

    // Allow only digits, spaces and optional leading +
    if (!/^\+?\d+$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    } else {
      const cleaned = phone.replace(/\s/g, "").replace(/^\+/, "");

      const zwRegex = /^(07\d{8}|2637\d{8})$/;

      if (!zwRegex.test(cleaned)) {
        newErrors.phone = "Please enter a valid phone number";
      }
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    await generateCustomer(form.email, form.fullName, form.phone); // your API call
    setIsLoading(false);
  };

  const paymentMethods = [
    {
      name: "EcoCash",
      desc: "Mobile wallet payment",
      icon: (
        <Image
          src="/payment-gateway-icon/EcoCash-Zimbabwe.png"
          alt="EcoCash"
          height={25}
          width={71}
        />
      ),
    },
    // {
    //   name: "InnBucks",
    //   desc: "Pay with InnBucks wallet",
    //   icon: (
    //     <Image
    //       src="/payment-gateway-icon/innbucks.png"
    //       alt="InnBucks"
    //       height={25}
    //       width={90}
    //     />
    //   ),
    // },
    {
      name: "ZimSwitch",
      desc: "Pay with local bank card",
      icon: (
        <Image
          src="/payment-gateway-icon/Zimswitchlo.png"
          alt="ZimSwitch"
          height={28}
          width={54}
        />
      ),
    },
  ];

  return (
    <>
      {/* MAIN CARD */}
      <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
        {/* Header */}
        <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[1.2] tracking-normal">
          To make payment
        </h1>
        <p className="mt-2 font-exo font-normal text-[12px] lg:text-[14px] leading-[1] tracking-normal text-[#2C6176]">
          Complete your details below to proceed to payment.
        </p>

        {/* Customer Details */}
        <div className="mt-6 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB]">
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-4">
            <div className="p-2 rounded-lg bg-[#FFFFFF]">
              <RxPerson
                className="text-[#2F5D6C]"
                size={20}
                strokeWidth={0.4}
              />
            </div>
            <h2 className="font-exo font-bold text-[20px] leading-[1.2] tracking-normal">
              Customer Details
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="font-exo font-bold text-[14px] text-[#111827]">
                Company Name
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                maxLength={70}
                placeholder="e.g. Example co. (Pvt) Ltd"
                className={`mt-1 w-full rounded-lg border px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#2F5D6C]/30 ${
                  errors.fullName ? "border-red-400 focus:ring-red-300/30" : ""
                }`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="font-exo font-bold text-[14px] text-[#111827]">
                Business Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleEmailBlur}
                maxLength={254}
                placeholder="e.g. john@email.com"
                className={`mt-1 w-full rounded-lg border px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#2F5D6C]/30 ${
                  errors.email ? "border-red-400 focus:ring-red-300/30" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="font-exo font-bold text-[14px] text-[#111827]">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                placeholder="e.g. +2637********"
                className={`mt-1 w-full rounded-lg border px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#2F5D6C]/30 ${
                  errors.phone ? "border-red-400 focus:ring-red-300/30" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="mt-6 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB]">
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-4">
            <div className="p-2 rounded-lg bg-[#FFFFFF]">
              <BsCurrencyDollar size={20} className="text-[#2F5D6C]" />
            </div>
            <h2 className="font-exo font-bold text-[16px]">Payment Currency</h2>
          </div>

          <div className="p-4">
            <p className="font-exo text-[14px] text-[#2C6176]">
              Select the currency that matches your location. This determines
              which payment methods are available.
            </p>

            <div className="mt-4 flex flex-col md:flex-row gap-3 bg-white p-2 border rounded-xl border-[#DCDCDC]">
              <button
                onClick={() => setCurrency("USD")}
                className={`flex-1 rounded-lg px-4 py-3 font-exo text-[14px] ${
                  currency === "USD"
                    ? "bg-[#2F5D6C] text-white border border-[#2F5D6C]"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3 w-fit mx-auto">
                  <Image
                    src="/flags/ZW.png"
                    alt="Zimbabwe"
                    height={25}
                    width={25}
                  />{" "}
                  USD - Zimbabwe
                </div>
              </button>

              <button
                onClick={() => setCurrency("ZAR")}
                disabled
                className={`flex-1 rounded-lg px-4 py-3 font-exo text-[14px] ${
                  currency === "ZAR"
                    ? "bg-[#2F5D6C] border text-white border-[#2F5D6C]"
                    : "bg-white"
                }`}
              >
                <div className="flex items-center gap-3 w-fit mx-auto">
                  <Image
                    src="/flags/ZA.png"
                    alt="Zimbabwe"
                    height={25}
                    width={25}
                  />{" "}
                  ZAR - South Africa
                </div>
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-[#E5E7EB] px-4 py-3 text-[12px] text-[#2C6176]">
              Payment methods: EcoCash · InnBucks · ZimSwitch
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          disabled={submitLoader}
          onClick={handleSubmit}
          className="mt-6 w-full rounded-xl bg-[#F59E0B] py-3 font-exo font-bold text-[16px] text-white hover:bg-[#D97706] flex items-center justify-center "
        >
          Proceed to Payment&nbsp;&nbsp;
          {isLoading ? (
            <div className="flex items-center justify-center w-fit h-fit rounded-full">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
            </div>
          ) : null}
        </button>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-center gap-2 font-exo font-normal text-[14px] leading-[1] tracking-normal text-center text-[#2C6176]">
          <IoLockClosedOutline />
          Secured by 256-bit SSL encryption
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="w-full max-w-[420px] rounded-t-xl md:rounded-xl bg-white overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#2F5D6C] text-white p-4">
              <div>
                <h3 className="font-exo font-bold text-[16px]">
                  Select Payment Method
                </h3>
                <p className="text-[12px] opacity-80">
                  {currency === "USD" ? "USD - Zimbabwe" : "ZAR - South Africa"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-[14px] text-[#6B7280]">
                Choose how you want to pay
              </p>

              {paymentMethods.map((item) => {
                const isActive = selectedMethod === item.name;

                return (
                  <div key={item.name} className="mb-3">
                    <div
                      onClick={() => setSelectedMethod(item.name)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 gap-2 transition ${
                        isActive
                          ? "border-2 border-[#2F5D6C] bg-[#E6F0F3]"
                          : "border-[#E5E7EB] hover:border-[#2F5D6C]/50"
                      }`}
                    >
                      <div
                        className={cn(
                          "py-2 w-[35%] rounded-lg flex items-center justify-center",
                          {
                            "bg-[#f3f4f6]": !isActive,
                            "bg-[#FFFFFF]": isActive,
                          },
                        )}
                      >
                        {item.icon}
                      </div>

                      <div className="w-[55%]">
                        <p className="font-exo font-bold text-[14px] text-[#111827]">
                          {item.name}
                        </p>
                        <p className="text-[12px] text-[#6B7280]">
                          {item.desc}
                        </p>
                      </div>

                      {isActive ? (
                        <FaCheckCircle className="text-[#2F5D6C] w-[10%]" />
                      ) : (
                        <div className="w-[10%]" />
                      )}
                    </div>

                    {/* Show input only for EcoCash */}
                    {isActive && item.name === "EcoCash" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          onChange={(event) => {
                            setEcocashNumber(event.target.value);
                            setErrors({});
                          }}
                          value={ecocashNumber}
                          placeholder="Enter EcoCash number"
                          className="w-full rounded-lg border border-[#D1D5DB] px-4 py-3 outline-none focus:border-[#2F5D6C]"
                        />
                        {errors.ecocashNumber && (
                          <p className="text-red-500 text-xs mt-1 mb-3">
                            {errors.ecocashNumber}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Cancel */}
              {selectedMethod ? (
                <button
                  className="px-6 py-3 bg-[#1f4d5a] text-white rounded-lg mt-4 w-full flex items-center justify-center"
                  onClick={() => {
                    if (selectedMethod === "EcoCash") {
                      const validationErrors = validate();

                      if (Object.keys(validationErrors).length > 0) {
                        setErrors(validationErrors);
                        return;
                      } else {
                        params.set("ecocashNumber", ecocashNumber);
                        window.history.replaceState(
                          null,
                          "",
                          `${window.location.pathname}?${params.toString()}`,
                        );
                        router.push(
                          `/redirect-checkout/echocash?${params.toString()}`,
                        );
                      }
                    } else if (selectedMethod === "ZimSwitch") {
                      router.push(
                        `/redirect-checkout/zimswitch?${params.toString()}`,
                      );
                    }
                  }}
                >
                  Make a payment →
                </button>
              ) : (
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-2 w-full rounded-xl border border-[#2F5D6C] py-3 text-[#2F5D6C]"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
