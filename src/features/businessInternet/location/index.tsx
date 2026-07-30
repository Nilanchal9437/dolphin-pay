"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, redirect } from "next/navigation";
import useDebounce from "@/src/hooks/useDebounce";
import { FaCheck } from "react-icons/fa";
import { LuX } from "react-icons/lu";
import { checkCoverage } from "@/src/features/businessInternet/apis/checkCoverage";
import { ServiceAvailability } from "@/src/types";

type Address = {
  description: string;
  place_id: string;
  city: string;
};

export const formatList = (items: string[]) => {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];

  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
};

export default function AvailabilityChecker() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Address | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [noService, setNoService] = useState(false);
  const [coverage, setCoverage] = useState<ServiceAvailability | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const sessionTokenRef = useRef<any>(null);

  const handleSelect = async (item: Address) => {
    setQuery(item.description);
    setSelected(item);
    setShowDropdown(false);
    setIsChecking(false);
    setNoService(false);
    const { AutocompleteSessionToken } = await (window as any).google.maps.importLibrary("places");
    sessionTokenRef.current = new AutocompleteSessionToken();
  };

  const checkAddress = async () => {
    setIsLoading(true);
    const response = await checkCoverage(selected?.description || query);
    if (response.status && response?.data?.available) {
      setIsChecking(true);
      setCoverage(response?.data);
    } else {
      setIsChecking(false);
      setNoService(true);
    }
    setIsLoading(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    setShowDropdown(true);
    if (value) {
      setIsFetchingSuggestions(true);
    }
  };

  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    if (!(window as any).google) return;

    setIsFetchingSuggestions(true);

    (async () => {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await (
          window as any
        ).google.maps.importLibrary("places");

        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: debouncedQuery,
          includedRegionCodes: ["zw"],
          sessionToken: sessionTokenRef.current,
        });

        const mapped = results.map((s: any) => {
          const pred = s.placePrediction;
          return {
            description: pred.text.toString(),
            place_id: pred.placeId,
            city: pred.secondaryText?.toString().split(",")[0] ?? "",
          };
        });

        setSuggestions(mapped);
      } catch {
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    })();
  }, [debouncedQuery]);

  if (search.get("homeCategory")) {
    return (
      <div className="w-full">
        <div className="w-full lg:max-w-3xl bg-white rounded-xl p-4 xl:p-8 shadow-sm">
          {/* Title */}
          <h1 className="font-exo font-bold text-[24px] lg:text-[34px] leading-[120%] tracking-normal">
            Check Availability in Your Area
          </h1>
          <p className="mt-2 font-exo font-normal text-[12px] lg:text-[14px] leading-[100%] tracking-normal text-[#2C6176]">
            Enter your address to see which connection options are available.
          </p>

          {/* Input */}
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-800">
              Street Address
            </label>

            <div className="relative mt-2">
              <input
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="e.g. 14 Samora Machel Ave"
                className={`w-full rounded-lg border px-4 py-3 outline-none text-sm ${
                  showDropdown ? "border-[#2F5D67]" : "border-gray-300"
                }`}
              />

              {/* Dropdown */}
              {showDropdown && query && !selected && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border bg-white shadow-sm max-h-40 overflow-y-auto">
                  {isFetchingSuggestions ? (
                    <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#2F5D67]"></div>
                      Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <div
                        key={item.place_id}
                        onClick={() => handleSelect(item)}
                        className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50"
                      >
                        {item.description}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Success Message */}
          {isChecking && (
            <div className="mt-6 rounded-lg border border-[#86EFAC] bg-[#DCFCE7] p-4 flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#BBF7D0]">
                <FaCheck className="text-green-700 text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Great news! We are available in your area.
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {formatList(
                    Array.isArray(coverage?.available_service_types) &&
                      coverage?.available_service_types?.length > 0
                      ? coverage?.available_service_types
                      : ["Fibre", "LTE", "FWA"],
                  )}{" "}
                  {(Array.isArray(coverage?.available_service_types) &&
                  coverage?.available_service_types.length > 2)
                    ? "are"
                    : "is"}{" "} available at your address.
                </p>
              </div>
            </div>
          )}
          {noService && (
            <div className="mt-6 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-4 flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FECACA]">
                <LuX className="text-red-700 text-lg" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Sorry we’re not available in your area.
                </p>

                <p className="text-sm text-red-700 mt-1">
                  services are currently not available at your address.
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-6 border-t border-gray-200" />

          {/* Buttons */}
          <div className="flex flex-col lg:flex-row gap-4">
            <button
              onClick={() => {
                setQuery("");
                setSelected(null);
                setShowDropdown(false);
                router.push(`/business-internet?homeCategory=${search.get("homeCategory")}`);
              }}
              className="px-6 py-2.5 rounded-lg border border-[#2F5D67] text-[#2F5D67] font-medium hover:bg-gray-50"
            >
              Back
            </button>

            <button
              className="flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#2F5D67] text-white font-medium hover:bg-[#254c54]"
              disabled={!selected}
              onClick={() => {
                 if (isChecking) {
                  if (selected) {
                    router.push(
                      `/business-internet/plan?homeCategory=${search.get("homeCategory")}&location=${encodeURIComponent(coverage?.address ?? selected.description)}&services=${JSON.stringify(coverage?.available_service_types)}&coordinates=${JSON.stringify(coverage?.coordinates)}&city=${selected?.city}`,
                    );
                  }
                } else {
                  checkAddress();
                } 
              }}
            >
              {isChecking ? "Continue →" : `Check Availability`}&nbsp;&nbsp;
              {isLoading ? (
                <div className="flex items-center justify-center w-fit h-fit rounded-full">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C7DFE6] border-t-[#2F5D6C]"></div>
                </div>
              ) : null}
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    redirect("/business-internet");
  }
}
