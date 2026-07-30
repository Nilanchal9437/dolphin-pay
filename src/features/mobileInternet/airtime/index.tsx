"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FiSmartphone, FiWifi, FiCheck } from "react-icons/fi";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import cn from "classnames";
import Button from "@/src/components/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { getAirtime } from "@/src/features/mobileInternet/apis/getAirTime";
import { ProductCategory, AirtimeBundle } from "@/src/types";
import { getAirtimeBundle } from "@/src/features/mobileInternet/apis/getAirtimeBundle";
import { generateSaleOrder } from "@/src/features/mobileInternet/apis/salesOrderGeneration";
import { getCustomerAccountNumber } from "@/src/features/mobileInternet/apis/getCustomerAccount";
import { createCustomer } from "@/src/features/mobileInternet/apis/createCustomer";
import { getAirtimeBundleProduct } from "@/src/features/mobileInternet/apis/getAirtimeBundleProduct";
import { getTagId } from "@/src/features/mobileInternet/apis/getTagId";

const NetworkCardSkeleton = () => {
  return (
    <div className="relative border border-gray-200 rounded-xl p-4 animate-pulse">
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center rounded-lg mb-3 bg-gray-200" />

      {/* Title */}
      <div className="h-4 w-32 bg-gray-200 rounded-md mb-2" />

      {/* Description */}
      <div className="h-3 w-40 bg-gray-200 rounded-md" />

      {/* Check Icon */}
      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gray-200" />
    </div>
  );
};

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  ecocashNumber?: string;
};

type FormData = {
  fullName: string;
  email: string;
  phone: string;
};

export default function Airtime() {
  const router = useRouter();
  const search = useSearchParams();
  const params = new URLSearchParams(search);
  const [showModal, setShowModal] = useState(false);
  const [network, setNetwork] = useState({
    variant_id: 0,
    variant_name: "",
    variant_price: 0,
  });
  const [currency, setCurrency] = useState("USD");
  const [airtimeProducts, setAirtimeProducts] = useState<ProductCategory[]>([]);
  const [airtimeBundles, setAirtimeBundles] = useState<AirtimeBundle[]>([]);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [variantProduct, setVariantProduct] = useState({
    variant_id: 0,
    variant_name: "",
    variant_price: 0,
  });
  const [form, setForm] = useState<FormData>({
    fullName: ``,
    email: ``,
    phone: ``,
  });
  const [ecocashNumber, setEcocashNumber] = useState<string>("");
  const [submitLoader, setSubmitLoader] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  const getAitimeProducts = async () => {
    setLoading(true);
    try {
      const { status, data } = await getAirtime(
        `${search.get("homeCategory")}`,
      );
      if (status && data && Array.isArray(data) && data.length > 0) {
        setAirtimeProducts(data);
        setNetwork({
          variant_id: data[0].products[0].product_variant_id[0],
          variant_name: data[0].products[0].product_variant_id[1],
          variant_price: data[0].products[0].list_price,
        });

        if (data[0].products[0].recurring_invoice) {
          params.set("planId", "1");
        }
        params.set(
          "selectedproduct",
          JSON.stringify([
            {
              variant_id: data[0].products[0].product_variant_id[0],
              variant_name: data[0].products[0].product_variant_id[1],
              variant_price: data[0].products[0].list_price,
            },
          ]),
        );

        params.set("productName", data[0].products[0].product_variant_id[1]);

        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`,
        );
      } else {
        setAirtimeProducts([]);
      }
    } catch (error) {
      console.error("Error fetching airtime products:", error);
    } finally {
      setLoading(false);
      try {
        setBundleLoading(true);

        const { status, data } = await getAirtimeBundle();

        if (status && data) {
          setAirtimeBundles(data);
        } else {
          setAirtimeBundles([]);
        }
      } catch (error) {
        console.error("Error fetching airtime bundles:", error);
      } finally {
        setBundleLoading(false);
      }
    }
  };

  useEffect(() => {
    getAitimeProducts();
  }, []);

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
    if (!email.trim()) return undefined; // don't show error for empty on blur
    if (email.length > 254) return "Please enter a valid email address";
    if (/\s/.test(email)) return "Please enter a valid email address";
    // Must contain @, valid local part, and a domain with at least one dot
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

  const validateName = (name: string): string | undefined => {
    if (!name.trim()) return undefined;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 70)
      return "Please enter a valid name";
    // Only letters (unicode), spaces, hyphens, and apostrophes
    if (!/^[\p{L}\s'\-]+$/u.test(trimmed)) return "Please enter a valid name";
    return undefined;
  };

  const handleNameBlur = () => {
    const error = validateName(form.fullName);
    setErrors((prev) => ({
      ...prev,
      fullName: error || "",
    }));
  };

  const generateCustomer = async (
    email: string,
    name: string,
    phone: string,
  ) => {
    setSubmitLoader(true);
    const body = {
      email: email,
      country_code: "ZW",
      name: name,
      phone: phone,
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

      const airtimeBundle = await getAirtimeBundleProduct();

      if (
        search.get("selectedVariant") &&
        airtimeBundle.status &&
        airtimeBundle.data
      ) {
        const varaint = JSON.parse(`${search.get("selectedVariant")}`);
        const finalBundle = varaint ? varaint : [];

        finalBundle.map((items: any) =>
          orderLines.push([
            0,
            0,
            {
              product_id: Number(
                `${airtimeBundle?.data ? airtimeBundle?.data?.id : 0}`,
              ),
              product_uom_qty: 1,
              price_unit: Number(`${items.variant_price}`),
              name: `${items.variant_name}`,
            },
          ]),
        );
      }
      if (search.get("selectedproduct")) {
        const product = JSON.parse(`${search.get("selectedproduct")}`);
        const finalProduct = product ? product : [];

        finalProduct.map((item: any) =>
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

      const orderResponse = await generateSaleOrder(body as any);

      if (orderResponse.status && orderResponse.data) {
        params.set("salesOderId", `${orderResponse.data[0]}`);
        params.set("orderType", `airtime`);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`,
        );
        setShowModal(true);
        setSubmitLoader(false);
      }
    }
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
      if (
        trimmed.length < 2 ||
        trimmed.length > 70 ||
        !/^[\p{L}\s'\-]+$/u.test(trimmed)
      ) {
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

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const stripped = form.phone.replace(/\s/g, "");
      if (
        !/^\d+$/.test(stripped) ||
        !/^07/.test(stripped) ||
        stripped.length < 10 ||
        stripped.length > 13
      ) {
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
      <div className="w-full">
        {/* STEP 1 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs tracking-widest text-gray-500 mb-2">
            <span className="w-6 h-6 flex items-center justify-center bg-[#2F5D62] text-white rounded-full text-xs">
              1
            </span>
            CHOOSE NETWORK
          </div>

          <h2 className="text-base font-bold mb-4">
            Select your mobile network
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading
              ? Array.from({ length: 2 }).map((_, index) => (
                  <NetworkCardSkeleton key={index} />
                ))
              : airtimeProducts.map((item) =>
                  item.products.map((product, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setNetwork({
                          variant_id: product.product_variant_id[0],
                          variant_name: product.product_variant_id[1],
                          variant_price: product.list_price,
                        });
                        if (product.recurring_invoice) {
                          params.set("planId", "1");
                        }
                        params.set(
                          "selectedproduct",
                          JSON.stringify([
                            {
                              variant_id: product.product_variant_id[0],
                              variant_name: product.product_variant_id[1],
                              variant_price: product.list_price,
                            },
                          ]),
                        );

                        params.set(
                          "productName",
                          product.product_variant_id[1],
                        );

                        window.history.replaceState(
                          null,
                          "",
                          `${window.location.pathname}?${params.toString()}`,
                        );
                      }}
                      className={`relative border rounded-xl p-4 cursor-pointer transition ${
                        network.variant_id === product.product_variant_id[0]
                          ? "border-[#F59E0B] bg-[#FFF7ED]"
                          : "border-gray-200"
                      }`}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 flex items-center justify-center rounded-lg mb-3",
                          {
                            "bg-[#FDE68A]":
                              network.variant_id ===
                              product.product_variant_id[0],
                            "bg-[#C9DFE4]":
                              network.variant_id !==
                              product.product_variant_id[0],
                          },
                        )}
                      >
                        {product.display_name.toLocaleLowerCase() ===
                        "dolphin airtime" ? (
                          <FiSmartphone
                            className={cn({
                              "text-[#F59E0B]":
                                network.variant_id ===
                                product.product_variant_id[0],
                              "text-[#2C6176]":
                                network.variant_id !==
                                product.product_variant_id[0],
                            })}
                          />
                        ) : (
                          <FiWifi
                            className={cn({
                              "text-[#F59E0B]":
                                network.variant_id ===
                                product.product_variant_id[0],
                              "text-[#2C6176]":
                                network.variant_id !==
                                product.product_variant_id[0],
                            })}
                          />
                        )}
                      </div>

                      <p className="font-semibold text-sm">
                        {product.display_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.description || ""}
                      </p>

                      {network.variant_id === product.product_variant_id[0] && (
                        <div className="absolute top-3 right-3 bg-[#F59E0B] text-white p-1 rounded-full">
                          <FiCheck size={12} />
                        </div>
                      )}
                    </div>
                  )),
                )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-[#DCDCDC] my-6" />

        {/* STEP 2 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs tracking-widest text-gray-500 mb-2">
            <span className="w-6 h-6 flex items-center justify-center bg-[#2F5D62] text-white rounded-full text-xs">
              2
            </span>
            ENTER MOBILE NUMBER
          </div>

          <h2 className="text-base font-bold mb-3">
            Which number should receive airtime?
          </h2>

          <label className="text-xs font-semibold">Mobile Number</label>

          <div
            className={`flex items-center border rounded-lg px-3 py-2 mt-1 ${
              errors.phone ? "border-red-400" : "border-[#2F5D6C]"
            }`}
          >
            <span className="text-sm font-medium mr-2">+263</span>
            <input
              type="tel"
              placeholder="7X XXX XXXX"
              className="w-full outline-none text-sm"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={handlePhoneBlur}
            />
          </div>

          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}

          <p className="text-[10px] text-gray-500 mt-1">
            Enter number without country code. e.g. 071 *** ****
          </p>

          <label className="text-xs font-semibold">Full Name</label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            onBlur={handleNameBlur}
            maxLength={70}
            placeholder="e.g. John Doe"
            className={`mt-1 w-full rounded-lg border px-4 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2F5D6C]/30 ${
              errors.fullName ? "border-red-400 focus:ring-red-300/30" : ""
            }`}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}

          <label className="text-xs font-semibold">Email Address</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            maxLength={254}
            placeholder="e.g. john@email.com"
            className={`mt-1 w-full rounded-lg border px-4 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#2F5D6C]/30 ${
              errors.email ? "border-red-400 focus:ring-red-300/30" : ""
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* DIVIDER */}
        <div className="border-t  border-[#DCDCDC] my-6" />

        {/* STEP 3 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs tracking-widest text-gray-500 mb-2">
            <span className="w-6 h-6 flex items-center justify-center bg-[#2F5D62] text-white rounded-full text-xs">
              3
            </span>
            SELECT AMOUNT
          </div>

          <h2 className="text-base font-bold mb-3">How much airtime?</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {bundleLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-10 animate-pulse rounded-lg bg-gray-200"
                  />
                ))
              : airtimeBundles.map((val) => (
                  <button
                    key={val.BundleId}
                    onClick={() => {
                      setVariantProduct({
                        variant_id: val.BundleId,
                        variant_name: val.Name,
                        variant_price: val.Amount,
                      });
                      params.set(
                        "selectedVariant",
                        JSON.stringify([
                          {
                            variant_id: val.BundleId,
                            variant_name: val.Name,
                            variant_price: val.Amount,
                          },
                        ]),
                      );
                      params.set("plan", val.Name);
                      window.history.replaceState(
                        null,
                        "",
                        `${window.location.pathname}?${params.toString()}`,
                      );
                    }}
                    className={`rounded-lg py-2 text-sm font-semibold transition ${
                      variantProduct.variant_id === val.BundleId
                        ? "border-2 border-[#F59E0B] bg-[#FFF7ED]"
                        : "border border-gray-200"
                    }`}
                  >
                    {val.Name}
                  </button>
                ))}
          </div>

          <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
            Custom Amount
          </label>
          <div className="flex items-center border  border-[#DCDCDC] rounded-lg px-3 py-2 mt-1">
            <span className="mr-2">$</span>
            <input
              type="number"
              placeholder="0.00"
              className="w-full outline-none text-sm"
              disabled
            />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-[#DCDCDC] my-6" />

        {/* STEP 4 */}
        <div>
          <div className="flex items-center gap-2 text-xs tracking-widest text-gray-500 mb-2">
            <span className="w-6 h-6 flex items-center justify-center bg-[#2F5D62] text-white rounded-full text-xs">
              4
            </span>
            CHECKOUT
          </div>

          <div className="flex justify-between items-center border border-[#DCDCDC] rounded-lg p-3 mb-4 bg-gray-50">
            <div>
              <p className="text-[10px] text-gray-500">Sending to</p>
              <p className="text-sm font-semibold">
                +263 {form.phone?.toString()}
              </p>
            </div>
            <p className="text-[#2F5D62] font-bold">
              $
              {Number(network.variant_price + variantProduct.variant_price) ??
                0}
            </p>
          </div>
          <Button
            variant="filld"
            className="mt-2 flex items-center justify-center"
            disabled={
              (network.variant_price === 0 &&
                variantProduct.variant_price === 0) ||
              submitLoader
            }
            onClick={handleSubmit}
          >
            Buy Airtime →&nbsp;&nbsp;
            {isLoading ? (
              <div className="flex items-center justify-center w-fit h-fit rounded-full">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
              </div>
            ) : null}
          </Button>
        </div>
      </div>
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
