"use client";

import Container from "@/src/components/Container";
import Stepper from "@/src/components/Stepper";
import PlanSummary from "@/src/components/SummaryPlan";
import Service from "@/src/components/Services";
import { LuBuilding2 } from "react-icons/lu";
import { FiSmartphone, FiHome } from "react-icons/fi";
import { getHomeCategories } from "@/src/features/connect/apis/homeCategories";
import { useEffect, useState, Suspense } from "react";
import { HomeCategory } from "@/src/features/connect/types/connect";

function Connect() {
  const steps = [
    { label: "Service", link: "#" },
    { label: "Location", link: "#" },
    { label: "Plan", link: "#" },
    { label: "Extras", link: "#" },
    { label: "Equipment", link: "#" },
    { label: "Review", link: "#" },
  ];

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<HomeCategory[]>([]);

  const getCategories = async () => {
    try {
      setLoading(true);
      const res = await getHomeCategories();
      if (res.status) {
        setCategories(res.data as HomeCategory[]);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  const hasMobile = categories.some((c) =>
    c.name.toLocaleLowerCase().includes("mobile"),
  );

  const services = [
    ...categories
      .filter(
        (category) =>
          category.name.toLocaleLowerCase().includes("home") ||
          category.name.toLocaleLowerCase().includes("business") ||
          category.name.toLocaleLowerCase().includes("mobile"),
      )
      .map((category) => ({
        id: category.id.toString(),
        title: category.name.toLocaleLowerCase().includes("home")
          ? "Home Internet"
          : category.name,
        description: category.name.toLocaleLowerCase().includes("home")
          ? "Reliable connectivity for your household. Fibre, LTE and wireless options available."
          : category.name.toLocaleLowerCase().includes("business")
            ? "Scalable internet solutions built for growing businesses and teams."
            : "Stay connected with flexible mobile plans and global eSIM across Zimbabwe, South Africa and beyond.",
        icon: category.name.toLocaleLowerCase().includes("home") ? (
          <FiHome />
        ) : category.name.toLocaleLowerCase().includes("business") ? (
          <LuBuilding2 />
        ) : (
          <FiSmartphone />
        ),
        link: category.name.toLocaleLowerCase().includes("home")
          ? "/home-internet"
          : category.name.toLocaleLowerCase().includes("business")
            ? "/business-internet"
            : "/mobile-internet",
      })),
    ...(!loading && !hasMobile
      ? [
          {
            id: "mobile-soon",
            title: "Mobile",
            description:
              "Stay connected with flexible mobile plans and global eSIM across Zimbabwe, South Africa and beyond.",
            icon: <FiSmartphone />,
            link: "/mobile-internet",
            disabled: true,
          },
        ]
      : []),
  ];

  return (
    <Suspense>
      <div className="text-center pt-[70px] lg:pt-[93px] min-h-0" />
      <Stepper steps={steps} currentStep={0} />
      <div className="bg-gray-100 pt-6 min-h-[100vh]">
        <Container>
          <div className="grid grid-cols-1 gap-y-6 gap-x-6 lg:grid-cols-12 justify-between">
            <div className="lg:col-span-8">
              <Service
                title="Let’s Get You Connected"
                subtitle="Select the service you'd like to set up."
                services={services}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-4">
              <PlanSummary items={[]} pricing={[]} />
            </div>
          </div>
        </Container>
      </div>
    </Suspense>
  );
}

export default Connect;
