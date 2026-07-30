"use client";

import { useState } from "react";
import { FaCheck } from "react-icons/fa";

interface FeePaneProps {
  title: string;
  subtitle: string;
  price: number;
  required: boolean;
  selected: boolean;
  onToggle?: () => void;
}

export default function FeePane({
  title,
  subtitle,
  price,
  required,
  selected,
  onToggle,
}: FeePaneProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-[#d1d5db] rounded-xl mb-4">
      <div className="flex justify-between items-center p-4">
        <div>
          <h2 className="font-semibold text-[#111827]">{title}</h2>
          <p className="text-sm text-[#6b7280]">{subtitle}</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 border rounded-lg text-sm"
        >
          {open ? "Collapse" : "Expand"}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          <div
            className={`relative border rounded-xl p-5 transition ${
              selected
                ? "border-[#f59e0b] bg-[#fff7ed]"
                : "border-[#e5e7eb] bg-white"
            } ${required ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => {
              if (!required && onToggle) onToggle();
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selected
                    ? "bg-[#f59e0b] border-[#f59e0b]"
                    : "border-[#d1d5db]"
                }`}
              >
                {selected && <FaCheck className="w-3 h-3 text-white" />}
              </div>
            </div>

            <p className="text-[#111827] font-medium">
              ${price.toFixed(2)}
              {required && (
                <span className="ml-2 text-xs text-[#6b7280] font-normal">
                  (required)
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
