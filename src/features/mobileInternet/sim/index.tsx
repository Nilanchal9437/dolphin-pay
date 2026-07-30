"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiMinus, FiPlus, FiInfo, FiUploadCloud, FiX } from "react-icons/fi";
import { FaTimes, FaCheckCircle } from "react-icons/fa";
import Button from "@/src/components/Button";
import { getSimCard } from "@/src/features/mobileInternet/apis/getSimCard";
import { ProductTemplate, AirtimeBundle } from "@/src/types";
import { getAirtimeBundle } from "@/src/features/mobileInternet/apis/getAirtimeBundle";
import { generateSaleOrder } from "@/src/features/mobileInternet/apis/salesOrderGeneration";
import { getCustomerAccountNumber } from "@/src/features/mobileInternet/apis/getCustomerAccount";
import { createCustomer } from "@/src/features/mobileInternet/apis/createCustomer";
import { getAirtimeBundleProduct } from "@/src/features/mobileInternet/apis/getAirtimeBundleProduct";
import { uploadDocument } from "@/src/features/mobileInternet/apis/uploadDocument";
import { getTagId } from "@/src/features/mobileInternet/apis/getTagId";
import cn from "classnames";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

export default function SimCard() {
  const router = useRouter();
  const search = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [accountType, setAccountType] = useState<"existing" | "new">(
    "existing",
  );
  const [currency, setCurrency] = useState("USD");
  const [airtimeEnabled, setAirtimeEnabled] = useState(false);
  // FILE STATE
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pricePerSim = 0.1;

  /* ---------- FILE HANDLING ---------- */

  const handleFile = (selected: File) => {
    setError("");

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Only PNG, JPG or PDF allowed");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("File must be less than 5MB");
      return;
    }

    // Convert file to Base64
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;
      const pureBase64 = base64.split(",")[1];
      setBase64(pureBase64);
      setFile(selected);
    };

    reader.readAsDataURL(selected);
  };

  // create preview URL safely
  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simcard, setSimCard] = useState<ProductTemplate | null>(null);
  const [airtimeBundles, setAirtimeBundles] = useState<AirtimeBundle[]>([]);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string>("");
  const [variantProduct, setVariantProduct] = useState({
    variant_id: 0,
    variant_name: "",
    variant_price: 0,
  });
  const [simcardVariant, setSimCardVariant] = useState({
    variant_id: 0,
    variant_name: "",
    variant_price: 0,
  });
  type FormData = {
    fullName: string;
    email: string;
    passport: string;
  };
  const [form, setForm] = useState<FormData>({
    fullName: ``,
    email: ``,
    passport: ``,
  });
  const params = new URLSearchParams(search);

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

  const getSimCards = async () => {
    try {
      setLoading(true);
      const res = await getSimCard(`${search.get("homeCategory")}`);
      if (res.status && Array.isArray(res?.data) && res?.data.length > 0) {
        setSimCard(res.data[0] as ProductTemplate);
        setSimCardVariant({
          variant_id: res.data[0].product_variant_id[0],
          variant_name: res.data[0].product_variant_id[1],
          variant_price: res.data[0].list_price,
        });
        params.set(
          "selectedproduct",
          JSON.stringify([
            {
              variant_id: res.data[0].product_variant_id[0],
              variant_name: res.data[0].product_variant_id[1],
              variant_price: res.data[0].list_price,
            },
          ]),
        );

        if (res.data[0].recurring_invoice) {
          params.set("planId", "1");
        }

        params.set("productName", res.data[0].product_variant_id[1]);

        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${params.toString()}`,
        );
      } else {
        setSimCard(null);
      }
    } catch (error) {
      console.error("Error fetching simcard:", error);
      setSimCard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSimCards();
  }, []);

  const getAirtimeBundles = async () => {
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
  };

  useEffect(() => {
    if (airtimeEnabled) {
      getAirtimeBundles();
    }
  }, [airtimeEnabled]);

  const total =
    quantity *
      (simcardVariant?.variant_price
        ? simcardVariant?.variant_price
        : pricePerSim) +
    (airtimeEnabled ? variantProduct.variant_price : 0);

  const [submitLoader, setSubmitLoader] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [ecocashNumber, setEcocashNumber] = useState<string>("");

  const generateCustomer = async () => {
    setSubmitLoader(true);

    const tagId = await getTagId();

    if (customerId && accountType === "existing") {
      params.set("customerId", `${customerId}`);

      const accountResponse = await getCustomerAccountNumber({
        customer_id: `${customerId}`,
      });

      if (accountResponse.status && accountResponse.data) {
        params.set("accountNumber", `${accountResponse.data.account_numbers}`);
        params.set("customerName", `${accountResponse.data.name}`);
        params.set("customerEmail", `${accountResponse.data.email}`);
        params.set("customerPhone", `${accountResponse.data.phone}`);
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
              product_uom_qty: quantity,
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
          partnerId: Number(`${customerId}`),
          partnerInvoiceId: Number(`${customerId}`),
          name: `${accountResponse.data?.name}`,
          partnerShippingId: Number(`${customerId}`),
          order_line: orderLines,
          plan_id: 1,
        };
      } else {
        body = {
          companyId: 1,
          partnerId: Number(`${customerId}`),
          partnerInvoiceId: Number(`${customerId}`),
          name: `${accountResponse.data?.name}`,
          partnerShippingId: Number(`${customerId}`),
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
    } else {
      const body = {
        country_code: "ZW",
        name: form.fullName,
        email: form.email,
        national_id_number: form.passport,
      };
      const response = await createCustomer(body);
      if (response.status && response.data) {
        params.set("customerId", `${response.data[0]}`);

        const upload = await uploadDocument([
          {
            name: file?.name,
            datas: base64,
            res_model: "res.partner",
            res_id: Number(`${response.data[0]}`),
            mimetype: file?.type,
            description: "Signed service contract",
          },
        ]);

        if (upload.data && upload.status) {
          const accountResponse = await getCustomerAccountNumber({
            customer_id: `${response.data[0]}`,
          });

          if (accountResponse.status && accountResponse.data) {
            params.set(
              "accountNumber",
              `${accountResponse.data.account_numbers}`,
            );
            params.set("customerName", `${accountResponse.data.name}`);
            params.set("customerEmail", `${accountResponse.data.email}`);
            params.set("customerPhone", `${accountResponse.data.phone}`);
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
                  product_uom_qty: quantity,
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
              name: `${accountResponse.data?.name}`,
              partnerShippingId: Number(`${response.data[0]}`),
              order_line: orderLines,
              plan_id: 1,
            };
          } else {
            body = {
              companyId: 1,
              partnerId: Number(`${response.data[0]}`),
              partnerInvoiceId: Number(`${response.data[0]}`),
              name: `${accountResponse.data?.name}`,
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
        } else {
          alert("Your document is not uploaded please try again later!");
        }
      } else {
        alert("Unable to create customer please try again after sometime!");
      }
    }
  };

  type FormErrors = {
    fullName?: string;
    passport?: string;
    customerId?: string;
    file?: string;
    ecocashNumber?: string;
    email?: string;
  };

  const validate = () => {
    const newErrors: FormErrors = {};
    if (selectedMethod === "EcoCash") {
      if (!ecocashNumber.trim()) {
        newErrors.ecocashNumber = "Echocash Number is required!";
      }
    }
    if (accountType === "existing") {
      if (!customerId.trim()) {
        newErrors.customerId = "Existing account number is required";
      }
    } else {
      if (!form.email.trim()) {
        newErrors.email = "Email is required";
      } else if (
        form.email.length > 254 ||
        /\s/.test(form.email) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)
      ) {
        newErrors.email = "Please enter a valid email address";
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

      if (!form.passport.trim()) {
        newErrors.passport = "Passport is required";
      }

      if (!file) {
        newErrors.file = "Passport document required";
      } else if (!ACCEPTED_TYPES.includes(file?.type)) {
        newErrors.file = "Only PNG, JPG or PDF allowed";
      } else if (file?.size > MAX_SIZE) {
        newErrors.file = "File must be less than 5MB";
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
    } else {
      await generateCustomer(); // your API call
    }

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
      <div>
        {/* STEP 1 */}
        <SectionTitle step="1" title="SELECT QUANTITY" />

        <h2 className="text-lg font-semibold mb-4">
          How many SIM cards do you need?
        </h2>

        {loading ? (
          <div className="flex border border-[#DCDCDC] rounded-lg w-fit overflow-hidden animate-pulse">
            {/* Minus Button */}
            <div className="p-3 bg-gray-100 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-300 rounded" />
            </div>

            {/* Quantity */}
            <div className="px-6 flex items-center justify-center">
              <div className="w-6 h-5 bg-gray-300 rounded" />
            </div>

            {/* Plus Button */}
            <div className="p-3 bg-gray-100 flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-300 rounded" />
            </div>
          </div>
        ) : simcard ? (
          <div className="flex border border-[#DCDCDC] rounded-lg w-fit overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className={`p-3 ${quantity <= 1 ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-100"}`}
            >
              <FiMinus />
            </button>

            <span className="px-6 flex items-center">{quantity}</span>

            <button
              onClick={() => setQuantity((q) => Math.min(5, q + 1))}
              disabled={quantity >= 5}
              className={`p-3 ${quantity >= 5 ? "bg-gray-50 text-gray-300 cursor-not-allowed" : "bg-gray-100"}`}
            >
              <FiPlus />
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-2 animate-pulse">
            <div className="h-4 w-64 bg-gray-200 rounded" />
          </div>
        ) : simcard ? (
          <>
            <p className="text-sm text-gray-500 mt-2">
              Each SIM card – ${simcard?.list_price || pricePerSim} (once-off)
            </p>
            <p className="text-xs text-gray-400 mt-1">Min 1, Max 5 SIMs</p>
          </>
        ) : null}

        <Divider />

        {/* STEP 2 */}
        <SectionTitle step="2" title="LINK YOUR SIM" />

        <h2 className="text-lg font-semibold mb-4">
          Connect to your Dolphin account
        </h2>

        {/* EXISTING */}
        <OptionCard
          active={accountType === "existing"}
          onClick={() => setAccountType("existing")}
          title="Add to Existing Dolphin Account"
          subtitle="Link directly to your current account"
        >
          {accountType === "existing" && (
            <>
              <p className="font-bold text-[12px] lg:text-[14px] leading-[100%] tracking-[0%] mt-3">
                Account Number
              </p>
              <input
                placeholder="e.g. DTL-0001234"
                className="mt-2 w-full md:w-72 border border-[#DCDCDC]  bg-white rounded-lg p-4 text-sm"
                onChange={(event) => setCustomerId(event.target.value)}
                value={customerId}
                disabled={!simcard}
              />
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
            </>
          )}
        </OptionCard>

        {/* NEW ACCOUNT */}
        <OptionCard
          active={accountType === "new"}
          onClick={() => setAccountType("new")}
          title="Create New Dolphin Account"
          subtitle="ID verification required after payment"
        >
          {accountType === "new" && (
            <>
              <div className="bg-white rounded-xl border border-[#DCDCDC] w-full max-w-2xl p-6 mt-4">
                {/* Header */}
                <h2 className="font-bold text-[14px] leading-[100%] tracking-normal">
                  Identity Verification
                </h2>
                <p className="font-normal text-[14px] leading-[100%] tracking-normal mt-2">
                  Required for new account activation. Your SIM will be active
                  after approval.
                </p>

                {/* Form */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      onBlur={handleNameBlur}
                      maxLength={70}
                      disabled={!simcard}
                      placeholder="As on ID document"
                      className={`mt-1 w-full border border-[#DCDCDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.fullName
                          ? "border-red-400 focus:ring-red-300/30"
                          : ""
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
                      National ID / Passport
                    </label>
                    <input
                      type="text"
                      name="passport"
                      value={form.passport}
                      onChange={handleChange}
                      disabled={!simcard}
                      placeholder="ID number"
                      className="mt-1 w-full border border-[#DCDCDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.passport && (
                      <p className="text-red-500 text-xs">{errors.passport}</p>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      maxLength={254}
                      disabled={!simcard}
                      placeholder="e.g. john@email.com"
                      className="mt-1 w-full border border-[#DCDCDC] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs">{errors.email}</p>
                    )}
                  </div>
                </div>
                <UploadBox
                  file={file}
                  preview={preview}
                  error={error}
                  setFile={setFile}
                  setError={setError}
                  disabled={!simcard}
                  inputRef={inputRef}
                  handleFile={handleFile}
                />
                {errors.file && (
                  <p className="text-red-500 text-xs mt-1">{errors.file}</p>
                )}
              </div>
            </>
          )}
        </OptionCard>
        {/* INFO */}
        <div className="flex items-center gap-2 mt-4 p-3 border border-yellow-400 bg-yellow-50 rounded-lg text-sm">
          <FiInfo
            className="text-[#F2A413] hidden sm:block"
            strokeWidth={2}
            size={20}
          />
          <FiInfo
            className="text-[#F2A413] block sm:hidden"
            strokeWidth={2}
            size={35}
          />
          <p>
            SIM activation is subject to regulatory verification in accordance
            with POTRAZ requirements.
          </p>
        </div>

        <Divider />

        {/* STEP 3 */}
        <SectionTitle step="3" title="ADD AIRTIME" optional />

        <div className="flex items-center justify-between border border-[#DCDCDC] rounded-lg p-4 bg-gray-100">
          <span className="font-bold text-[16px] leading-[120%] tracking-normal">
            Add Airtime Now
          </span>

          <button
            onClick={() => setAirtimeEnabled(!airtimeEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 ${
              airtimeEnabled ? "bg-teal-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full transition ${
                airtimeEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {airtimeEnabled && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
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
        )}

        {airtimeEnabled && (
          <div className="mt-3">
            <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
              Custom Amount
            </label>
            <div className="flex items-center border border-[#DCDCDC]  rounded-lg px-3 py-2 mt-1">
              <span className="mr-2">$</span>
              <input
                type="number"
                placeholder="0.00"
                className="w-full outline-none text-sm"
                disabled
              />
            </div>
            <label className="font-normal text-[10px] lg:text-[12px] text-[#6B7280] leading-[100%] tracking-normal pt-2">
              Airtime will be loaded once your SIM is activated.
            </label>
          </div>
        )}

        <Divider />

        {/* SUMMARY */}
        <div className="border border-[#DCDCDC] rounded-lg p-4 flex justify-between">
          <div>
            <p className="text-xs font-normal leading-[100%]">Order Summary</p>
            <p className="font-bold text-[16px] leading-[120%] tracking-normal mt-1">
              {quantity}× SIM Card – $
              {quantity *
                (simcard?.list_price ? simcard?.list_price : pricePerSim)}
            </p>
          </div>
          <p className="text-xl font-semibold">${total.toFixed(2)}</p>
        </div>

        <Button
          variant="filld"
          className="mt-2 flex items-center justify-center"
          disabled={
            (accountType === "existing"
              ? customerId == ""
                ? true
                : false
              : form.fullName === "" || form.passport === ""
                ? true
                : false) ||
            submitLoader ||
            isLoading ||
            !simcard
          }
          onClick={handleSubmit}
        >
          Proceed to Checkout →&nbsp;&nbsp;
          {isLoading ? (
            <div className="flex items-center justify-center w-fit h-fit rounded-full">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
            </div>
          ) : null}
        </Button>
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

/* ---------- Upload Component ---------- */

function UploadBox({
  file,
  preview,
  error,
  setFile,
  setError,
  inputRef,
  handleFile,
}: any) {
  return (
    <>
      <label className="font-bold text-[14px] leading-[100%] tracking-normal text-gray-800">
        Upload ID Document
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-[#DCDCDC] rounded-xl p-6 mt-1 text-center cursor-pointer bg-gray-50"
      >
        {!file ? (
          <>
            <FiUploadCloud className="mx-auto text-xl text-gray-400" />
            <p className="text-sm text-gray-500">
              Click to upload or drag & drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG or PDF - max 5MB</p>
          </>
        ) : (
          <p className="text-green-600 text-sm">{file.name}</p>
        )}
      </div>

      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />

      {/* Error */}
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {/* Preview */}
      {file && (
        <div className="mt-4 relative">
          <button
            onClick={() => {
              setFile(null);
              setError("");
            }}
            className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
          >
            <FiX />
          </button>

          {file.type.startsWith("image") ? (
            <img
              src={preview}
              alt="preview"
              className="w-full max-h-64 object-cover rounded-lg"
            />
          ) : (
            <iframe
              src={preview}
              className="w-full h-[80vh] rounded-lg border"
            />
          )}
        </div>
      )}
    </>
  );
}

/* ---------- UI ---------- */

function SectionTitle({ step, title, optional }: any) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-6 h-6 bg-teal-700 text-white rounded-full flex items-center justify-center text-xs">
        {step}
      </div>
      <p className="text-xs uppercase tracking-widest text-gray-500">
        {title} {optional && "(Optional)"}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="my-6 border-t border-[#DCDCDC]" />;
}

function OptionCard({ active, onClick, title, subtitle, children }: any) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 mb-3 cursor-pointer ${
        active
          ? "border-2 border-[#2C6176] bg-[#E9F4F6]"
          : "border border-[#DCDCDC]"
      }`}
    >
      <div className="flex gap-3">
        <div className="w-5 h-5 border rounded-full flex items-center justify-center">
          {active && <div className="w-2.5 h-2.5 bg-teal-700 rounded-full" />}
        </div>

        <div>
          <p className="font-bold text-[14px] lg:text-[16px] leading-[120%]">
            {title}
          </p>
          <p className="font-normal text-xs text-[12px] lg:text-[14px] leading-none text-[#6B7280]">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="lg:ml-8">{children}</div>
    </div>
  );
}
