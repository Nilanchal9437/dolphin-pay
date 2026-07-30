"use client";

import Image from "next/image";
import getAttributeValues from "@/src/components/Layout/apis/getAttributeValue";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AttributeValue } from "@/src/types";
import AppBar from "@/src/components/AppBar";
import Container from "@/src/components/Container";
import Stepper from "@/src/components/Stepper";
import PlanSummary from "@/src/components/SummaryPlan";
import { useState, Suspense, type ReactNode } from "react";
import { FiHome, FiMapPin, FiPackage, FiWifi, FiDollarSign } from "react-icons/fi";
import { LuRadio } from "react-icons/lu";
interface ItemType {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  value?: string;
}

interface PriceType {
  label: string;
  value: number;
  type?: string;
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [items, setItems] = useState<ItemType[]>([]);
  const [pricing, setPricing] = useState<PriceType[]>([]);

  const param = new URLSearchParams(search);

  const generateParams = (type: string) => {
    if (type === "Location") {
      param.set("homeCategory", `${search.get("homeCategory")}`);
      return param;
    } else if (type === "Plan") {
      param.set("homeCategory", `${search.get("homeCategory")}`);
      param.set("services", `${search.get("services")}`);
      param.set("coordinates", `${search.get("coordinates")}`);
      param.set("city", `${search.get("city")}`);
      param.set("childCategory", `${search.get("childCategory")}`);
      param.set("childCategoryName", `${search.get("childCategoryName")}`);
      param.set("product", `${search.get("product")}`);
      param.set("price", `${search.get("price")}`);
      param.set("productName", `${search.get("productName")}`);
      if (search.get("attribute")) {
        param.set("attribute", `${search.get("attribute")}`);
      }
      if (search.get("variant")) {
        param.set("variant", `${search.get("variant")}`);
      }
      return param;
    } else if (type === "Extras") {
      param.set("homeCategory", `${search.get("homeCategory")}`);
      param.set("services", `${search.get("services")}`);
      param.set("coordinates", `${search.get("coordinates")}`);
      param.set("city", `${search.get("city")}`);
      param.set("childCategory", `${search.get("childCategory")}`);
      param.set("childCategoryName", `${search.get("childCategoryName")}`);
      param.set("product", `${search.get("product")}`);
      param.set("price", `${search.get("price")}`);
      param.set("productName", `${search.get("productName")}`);
      if (search.get("attribute")) {
        param.set("attribute", `${search.get("attribute")}`);
      }
      if (search.get("variant")) {
        param.set("variant", `${search.get("variant")}`);
      }
      param.set("voucher", `${search.get("voucher")}`);
      param.set("voucherPrice", `${search.get("voucherPrice")}`);
      return param;
    } else if (type === "Equipment") {
      param.set("homeCategory", `${search.get("homeCategory")}`);
      param.set("services", `${search.get("services")}`);
      param.set("coordinates", `${search.get("coordinates")}`);
      param.set("city", `${search.get("city")}`);
      param.set("childCategory", `${search.get("childCategory")}`);
      param.set("childCategoryName", `${search.get("childCategoryName")}`);
      param.set("product", `${search.get("product")}`);
      param.set("price", `${search.get("price")}`);
      param.set("productName", `${search.get("productName")}`);
      if (search.get("attribute")) {
        param.set("attribute", `${search.get("attribute")}`);
      }
      if (search.get("variant")) {
        param.set("variant", `${search.get("variant")}`);
      }
      param.set("voucher", `${search.get("voucher")}`);
      param.set("voucherPrice", `${search.get("voucherPrice")}`);
      param.set("equipmentName", `${search.get("equipmentName")}`);
      param.set("equipmentId", `${search.get("equipmentId")}`);
      param.set("customerId", `${search.get("customerId")}`);
      param.set("customerName", `${search.get("customerName")}`);
      param.set("customerEmail", `${search.get("customerEmail")}`);
      param.set("customerPhone", `${search.get("customerPhone")}`);
      return param;
    } else if (type === "Review") {
      param.set("homeCategory", `${search.get("homeCategory")}`);
      param.set("services", `${search.get("services")}`);
      param.set("coordinates", `${search.get("coordinates")}`);
      param.set("city", `${search.get("city")}`);
      param.set("childCategory", `${search.get("childCategory")}`);
      param.set("childCategoryName", `${search.get("childCategoryName")}`);
      param.set("product", `${search.get("product")}`);
      param.set("price", `${search.get("price")}`);
      param.set("productName", `${search.get("productName")}`);
      if (search.get("attribute")) {
        param.set("attribute", `${search.get("attribute")}`);
      }
      if (search.get("variant")) {
        param.set("variant", `${search.get("variant")}`);
      }
      param.set("voucher", `${search.get("voucher")}`);
      param.set("voucherPrice", `${search.get("voucherPrice")}`);
      param.set("equipmentName", `${search.get("equipmentName")}`);
      param.set("equipmentId", `${search.get("equipmentId")}`);
      param.set("customerId", `${search.get("customerId")}`);
      param.set("customerName", `${search.get("customerName")}`);
      param.set("customerEmail", `${search.get("customerEmail")}`);
      param.set("customerPhone", `${search.get("customerPhone")}`);
      return param;
    }
  };

  const steps = [
    { label: "Service", link: "/" },
    {
      label: "Location",
      link: `/home-internet?${generateParams("Location")?.toString()}`,
    },
    {
      label: "Plan",
      link: `/home-internet/plan?${generateParams("Location")?.toString()}`,
    },
    {
      label: "Extras",
      link: `/home-internet/extras?${generateParams("Extras")?.toString()}`,
    },
    {
      label: "Equipment",
      link: `/home-internet/equipment?${generateParams("Equipment")?.toString()}`,
    },
    {
      label: "Review",
      link: `/home-internet/review?${generateParams("Review")?.toString()}`,
    },
  ];

  const getProductAttribute = async (attributeIds: number[]) => {
    const { status, data } = await getAttributeValues(attributeIds);

    if (status && data) {
      const values = [];
      const price: PriceType[] = [];

      values.push({
        id: "service",
        title: "Home Internet",
        subtitle: "Selected service",
        icon: <FiHome />,
      });
      if (search.get("location")) {
        values.push({
          id: "address",
          title: `${search.get("location")}`,
          subtitle: "Service address",
          icon: <FiMapPin />,
        });
      }
      if (search.get("childCategoryName")) {
        values.push({
          id: `${search.get("childCategory")}`,
          title: `${search.get("childCategoryName")}`,
          subtitle: "Connection type",
          icon: <LuRadio />,
        });
      }

      if (search.get("productName") && search.get("price")) {
        const newItem = {
          id: "product",
          title: `${search.get("productName")}`,
          subtitle: `${formatPlan(data)}`,
          value: `$${search.get("price")}`,
          icon: <FiPackage />,
        };

        price.push({
          label: `${search.get("productName")}`,
          value: Number(`${search.get("price")}`),
          type: `price`,
        });

        // ✅ Insert if not found
        values.push(newItem);
      }

      if (search.get("voucher")) {
        const voucher = JSON.parse(`${search.get("voucher")}`);
        if (voucher) {
          voucher.map((item: any) => {
            values.push({
              id: `voucher-${item.id}`,
              title: `${item.name}`,
              subtitle: `${item?.group.charAt(0).toUpperCase() + item?.group.slice(1).toLowerCase()} Voucher`,
              icon: (
                <Image
                  src={item.image}
                  alt={item.name}
                  height={40}
                  width={40}
                />
              ),
              value: `$${Number(item.price).toFixed(2)}`,
            });
            price.push({
              label: `${item?.group.charAt(0).toUpperCase() + item?.group.slice(1).toLowerCase()} Voucher - ${item.name}`,
              value: Number(`${item.price}`),
              type: `price`,
            });
          });
        }
      }

      const equipId = search.get("equipmentId") || search.get("productEquipment");
      const equipName = search.get("equipmentName") || search.get("productNameEquipment");
      const equipProductName = search.get("productNameEquipment");
      const equipPrice = search.get("priceEquipment");
      const isValidStr = (v: string | null) => !!v && v !== "null" && v !== "undefined";
      const validEquipPrice = isValidStr(equipPrice) && !isNaN(Number(equipPrice)) && Number(equipPrice) > 0;
      if (isValidStr(equipId) && isValidStr(equipName)) {
        values.push({
          id: `equipment`,
          title: `${isValidStr(equipProductName) ? equipProductName : equipName}`,
          subtitle: `Equipment`,
          icon: <FiWifi />,
          value: validEquipPrice ? `$${equipPrice}` : `Included`,
        });

        price.push({
          label: `${isValidStr(equipProductName) ? equipProductName : equipName}`,
          value: validEquipPrice ? Number(equipPrice) : 0,
          type: validEquipPrice ? `price` : "Included",
        });
      }

      if (search.get("optionalFees")) {
        const fees = JSON.parse(search.get("optionalFees") || "[]");
        fees.forEach((fee: any) => {
          values.push({
            id: `fee-${fee.variantId}`,
            title: fee.name,
            subtitle: "Additional fee",
            icon: <FiDollarSign />,
            value: `$${Number(fee.price).toFixed(2)}`,
          });
          price.push({
            label: fee.name,
            value: Number(fee.price),
            type: "fee",
          });
        });
      }

      setItems(values);
      setPricing(price);
    } else {
      const values = [];
      const price: PriceType[] = [];

      values.push({
        id: "service",
        title: "Home Internet",
        subtitle: "Selected service",
        icon: <FiHome />,
      });

      if (search.get("location")) {
        values.push({
          id: "address",
          title: `${search.get("location")}`,
          subtitle: "Service address",
          icon: <FiMapPin />,
        });
      }
      if (search.get("childCategoryName")) {
        values.push({
          id: `${search.get("childCategory")}`,
          title: `${search.get("childCategoryName")}`,
          subtitle: "Connection type",
          icon: <LuRadio />,
        });
      }

      if (search.get("voucher")) {
        const voucher = JSON.parse(`${search.get("voucher")}`);
        if (voucher) {
          voucher.map((item: any) => {
            values.push({
              id: `voucher-${item.id}`,
              title: `${item.name}`,
              subtitle: `${item?.group.charAt(0).toUpperCase() + item?.group.slice(1).toLowerCase()} Voucher`,
              icon: (
                <Image
                  src={item.image}
                  alt={item.name}
                  height={40}
                  width={40}
                />
              ),
              value: `$${Number(item.price).toFixed(2)}`,
            });
            price.push({
              label: `${item?.group.charAt(0).toUpperCase() + item?.group.slice(1).toLowerCase()} Voucher - ${item.name}`,
              value: Number(`${item.price}`),
              type: `price`,
            });
          });
        }
      }

      const equipId2 = search.get("equipmentId") || search.get("productEquipment");
      const equipName2 = search.get("equipmentName") || search.get("productNameEquipment");
      const equipProductName2 = search.get("productNameEquipment");
      const equipPrice2 = search.get("priceEquipment");
      const isValidStr2 = (v: string | null) => !!v && v !== "null" && v !== "undefined";
      const validEquipPrice2 = isValidStr2(equipPrice2) && !isNaN(Number(equipPrice2)) && Number(equipPrice2) > 0;
      if (isValidStr2(equipId2) && isValidStr2(equipName2)) {
        values.push({
          id: `equipment`,
          title: `${isValidStr2(equipProductName2) ? equipProductName2 : equipName2}`,
          subtitle: `Equipment`,
          icon: <FiWifi />,
          value: validEquipPrice2 ? `$${equipPrice2}` : `Included`,
        });
        price.push({
          label: `${isValidStr2(equipProductName2) ? equipProductName2 : equipName2}`,
          value: validEquipPrice2 ? Number(equipPrice2) : 0,
          type: validEquipPrice2 ? `price` : "Included",
        });
      }

      if (search.get("optionalFees")) {
        const fees = JSON.parse(search.get("optionalFees") || "[]");
        fees.forEach((fee: any) => {
          values.push({
            id: `fee-${fee.variantId}`,
            title: fee.name,
            subtitle: "Additional fee",
            icon: <FiDollarSign />,
            value: `$${Number(fee.price).toFixed(2)}`,
          });
          price.push({
            label: fee.name,
            value: Number(fee.price),
            type: "fee",
          });
        });
      }

      setItems(values);
      setPricing(price);
    }
  };

  const formatPlan = (data: AttributeValue[]): string => {
    let amount = "";
    let speed = "";

    for (const item of data) {
      const attributeName = item.attribute_id[1];

      if (attributeName.toLowerCase() === "amount") {
        amount = item.name;
      }

      if (attributeName.toLowerCase() === "speed") {
        speed = item.name;
      }
    }

    return [amount, speed].filter(Boolean).join(" / ");
  };

  useEffect(() => {
    if (
      pathname === "/home-internet/plan" ||
      pathname === "/home-internet/extras" ||
      pathname === "/home-internet/equipment" ||
      pathname === "/home-internet/review" ||
      pathname === "/home-internet/checkout"
    ) {
      const data: ItemType[] = [];
      const price: PriceType[] = [];

      data.push({
        id: "service",
        title: "Home Internet",
        subtitle: "Selected service",
        icon: <FiHome />,
      });
      if (search.get("location")) {
        data.push({
          id: "address",
          title: `${search.get("location")}`,
          subtitle: "Service address",
          icon: <FiMapPin />,
        });
      }
      if (search.get("childCategoryName")) {
        data.push({
          id: `${search.get("childCategory")}`,
          title: `${search.get("childCategoryName")}`,
          subtitle: "Connection type",
          icon: <LuRadio />,
        });
      }
      if (
        search.get("productName") &&
        search.get("product") &&
        search.get("price")
      ) {
        data.push({
          id: "product",
          title: `${search.get("productName")}`,
          subtitle: ``,
          value: `$${search.get("price")}`,
          icon: <FiPackage />,
        });
        price.push({
          label: `${search.get("productName")}`,
          value: Number(`${search.get("price")}`),
          type: `price`,
        });
      }

      getProductAttribute(JSON.parse(`${search.get("attribute")}`));

      setItems([...data]);
      setPricing([...price]);
    } else if (pathname === "/home-internet") {
      setItems([]);
      setPricing([]);
    }
  }, [pathname, search]);
  return (
    <Suspense>
      <AppBar />
      <div className="text-center pt-[70px] lg:pt-[93px] min-h-0" />
      <Stepper
        steps={steps}
        currentStep={
          pathname === "/home-internet"
            ? 1
            : pathname === "/home-internet/plan"
              ? 2
              : pathname === "/home-internet/extras"
                ? 3
                : pathname === "/home-internet/equipment"
                  ? 4
                  : pathname === "/home-internet/review"
                    ? 5
                    : 0
        }
      />
      <div className="bg-gray-100 pt-6 min-h-[100vh]">
        <Container className="grid grid-cols-1 gap-y-6 gap-x-6 xl:gap-0 lg:grid-cols-12 justify-between">
          <div className="lg:col-span-8">{children}</div>
          <div className="lg:col-span-4">
            <PlanSummary items={items} pricing={pricing} />
          </div>
        </Container>
      </div>
    </Suspense>
  );
}
