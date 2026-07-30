"use client";

import { redirect, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { EquipmentCategory } from "@/src/types";
import { FiPackage } from "react-icons/fi";
import { getEquipment } from "@/src/features/businessInternet/apis/getEquipment";
import EquipmentVariant from "@/src/features/businessInternet/equipment/equipmentVariant";
import { getOptionalProducts } from "@/src/features/businessInternet/apis/getOptionalProducts";
import FeePane from "@/src/components/FeePane";

type OptionalProduct = {
  id: number;
  name: string;
  display_name: string;
  list_price: number;
  product_variant_id: [number, string];
};

export default function EquipmentSetup() {
  const search = useSearchParams();

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
    !search.get("price")
  ) {
    redirect(
      `/business-internet/plan?homeCategory=${search.get("homeCategory")}&location=${search.get("location")}&services=${search.get("services")}&coordinates=${search.get("coordinates")}&city=${search.get("city")}`,
    );
  } else {
    const router = useRouter();
    const searchParams = Object.fromEntries(search.entries());
    const params = new URLSearchParams(searchParams);
    const [loading, setLoading] = useState(true);
    const [equipment, setEquipment] = useState<EquipmentCategory | null>(null);
    const [feesLoading, setFeesLoading] = useState(false);
    const [installationFee, setInstallationFee] = useState<OptionalProduct | null>(null);
    const [deliveryFee, setDeliveryFee] = useState<OptionalProduct | null>(null);
    const [deliveryFeeSelected, setDeliveryFeeSelected] = useState(false);
    const [selectedEquipVariantId, setSelectedEquipVariantId] = useState<string | null>(null);

    const getProductEquipments = async () => {
      try {
        setLoading(true);
        const res = await getEquipment(
          search.get("homeCategory") || "",
          search.get("childCategoryName") ?? "",
          search.get("product") ?? "",
        );
        if (res.status) {
          setEquipment(res.data as EquipmentCategory);
        } else {
          setEquipment(null);
        }
      } catch (error) {
        console.error("Error fetching equipment:", error);
        setEquipment(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchOptionalProducts = async (variantId: string) => {
      if (!variantId) return;

      setFeesLoading(true);
      try {
        const res = await getOptionalProducts(variantId);
        if (res.status && Array.isArray(res.data) && res.data.length > 0) {
          const installation: OptionalProduct | undefined = res.data.find(
            (p: OptionalProduct) => p.name.toLowerCase().includes("installation fee"),
          );
          const delivery: OptionalProduct | undefined = res.data.find(
            (p: OptionalProduct) => p.name.toLowerCase().includes("delivery fee"),
          );

          setInstallationFee(installation ?? null);
          setDeliveryFee(delivery ?? null);

          const existingFees = search.get("optionalFees");
          if (existingFees && delivery) {
            const fees = JSON.parse(existingFees);
            const deliverySelected = fees.some(
              (f: any) => f.variantId === delivery.product_variant_id[0],
            );
            setDeliveryFeeSelected(deliverySelected);
          }

          if (installation) {
            const currentParams = new URLSearchParams(window.location.search);
            const fees: any[] = [
              {
                variantId: installation.product_variant_id[0],
                name: installation.name,
                price: installation.list_price,
              },
            ];
            if (existingFees) {
              const parsed = JSON.parse(existingFees);
              const hasDelivery =
                delivery &&
                parsed.some((f: any) => f.variantId === delivery.product_variant_id[0]);
              if (hasDelivery && delivery) {
                fees.push({
                  variantId: delivery.product_variant_id[0],
                  name: delivery.name,
                  price: delivery.list_price,
                });
              }
            }
            currentParams.set("optionalFees", JSON.stringify(fees));
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}?${currentParams.toString()}`,
            );
          }
        } else {
          setInstallationFee(null);
          setDeliveryFee(null);
          const currentParams = new URLSearchParams(window.location.search);
          currentParams.delete("optionalFees");
          window.history.replaceState(null, "", `${window.location.pathname}?${currentParams.toString()}`);
        }
      } catch (error) {
        console.error("Error fetching optional products:", error);
      } finally {
        setFeesLoading(false);
      }
    };

    const toggleDeliveryFee = () => {
      const newSelected = !deliveryFeeSelected;
      setDeliveryFeeSelected(newSelected);

      const currentParams = new URLSearchParams(window.location.search);
      const fees: any[] = installationFee
        ? [
            {
              variantId: installationFee.product_variant_id[0],
              name: installationFee.name,
              price: installationFee.list_price,
            },
          ]
        : [];

      if (newSelected && deliveryFee) {
        fees.push({
          variantId: deliveryFee.product_variant_id[0],
          name: deliveryFee.name,
          price: deliveryFee.list_price,
        });
      }

      if (fees.length > 0) {
        currentParams.set("optionalFees", JSON.stringify(fees));
      } else {
        currentParams.delete("optionalFees");
      }
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${currentParams.toString()}`,
      );
    };

    useEffect(() => {
      getProductEquipments();
      const equipVariantId = search.get("productEquipment");
      if (equipVariantId) fetchOptionalProducts(equipVariantId);
    }, []);

    useEffect(() => {
      if (selectedEquipVariantId) fetchOptionalProducts(selectedEquipVariantId);
    }, [selectedEquipVariantId]);

    const handleSubmit = async () => {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set("equipmentName", `${equipment?.name}`);
      currentParams.set("equipmentId", `${equipment?.id}`);
      router.push(`/business-internet/review?${currentParams.toString()}`);
    };

    return (
      <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
        {/* Header */}
        <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[1.2] tracking-normal mb-2">
          Equipment & Setup
        </h1>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-3 lg:h-4 w-full bg-gray-300 rounded"></div>
            <div className="mt-2 h-3 lg:h-4 w-5/6 bg-gray-300 rounded"></div>
          </div>
        ) : equipment?.x_studio_label ? (
          <p className="font-exo font-normal text-[12px] lg:text-[14px] leading-[1] tracking-normal text-[#2C6176]">
            {equipment?.x_studio_label}
          </p>
        ) : null}

        {/* Equipment Card */}
        {loading ? (
          <div className="mt-6 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] p-5 animate-pulse">
            <div className="flex items-start lg:items-center gap-4">
              <div className="flex p-4 items-center justify-center rounded-lg bg-white">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-300 rounded"></div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-full bg-gray-300 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-300 rounded"></div>
                  <div className="h-3 w-4/6 bg-gray-300 rounded"></div>
                </div>
                <div className="mt-3 h-3 w-36 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        ) : Array.isArray(equipment?.products) &&
          equipment?.products.length > 0 ? (
          <EquipmentVariant
            categories={[equipment]}
            onEquipmentChange={(variantId) => setSelectedEquipVariantId(variantId)}
          />
        ) : (
          <div className="mt-6 rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] p-5">
            <div className="flex items-start lg:items-center gap-4">
              <div className="flex p-4 text-3xl items-center justify-center rounded-lg bg-[#FFFFFF]">
                <FiPackage />
              </div>
              <div>
                <h2 className="font-exo font-bold text-[20px] leading-[1.2] tracking-normal">
                  {equipment?.name}
                </h2>
                <p className="font-exo font-normal text-[14px] leading-[1.2] tracking-normal mt-2 text-[#6B7280]">
                  Your {equipment?.name} is included with your&nbsp;
                  {search.get("childCategoryName")}&nbsp;installation at no
                  additional cost. Our technician will install and configure it
                  during your scheduled visit.
                </p>
                <p className="mt-2 font-exo font-bold text-[14px] leading-[1] tracking-normal text-[#16A34A]">
                  Included with installation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fee Panes */}
        {!feesLoading && (installationFee || deliveryFee) && (
          <div className="mt-4">
            {installationFee && (
              <FeePane
                title={installationFee.name}
                subtitle="One-time professional installation at your address"
                price={installationFee.list_price}
                required={true}
                selected={true}
              />
            )}
            {deliveryFee && (
              <FeePane
                title={deliveryFee.name}
                subtitle="Equipment delivery to your address"
                price={deliveryFee.list_price}
                required={false}
                selected={deliveryFeeSelected}
                onToggle={toggleDeliveryFee}
              />
            )}
          </div>
        )}

        {/* Divider */}
        <div className="my-6 h-[1px] w-full bg-[#E5E7EB]" />

        {/* Buttons */}
        <div className="flex flex-col lg:flex-row gap-4 mt-6">
          <button
            className="px-6 py-3 border-3 border-[#1f4d5a] rounded-lg"
            onClick={() => {
              router.push(`/business-internet/extras?${params.toString()}`);
            }}
          >
            Back
          </button>
          <button
            className="px-6 py-3 bg-[#1f4d5a] text-white rounded-lg"
            disabled={loading}
            onClick={() => {
              handleSubmit();
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }
}
