"use client";

import React from "react";
import { FaCheck } from "react-icons/fa";

type Props = {
  id: string;
  title: string;
  description: string;
  icon: React.JSX.Element;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
};

const ServiceCard: React.FC<Props> = ({
  id,
  title,
  description,
  icon,
  selected,
  disabled = false,
  onSelect,
}) => {
  return (
    <div
      onClick={() => !disabled && onSelect(id)}
      className={`
        relative rounded-xl border p-5 transition-all
        ${
          disabled
            ? "cursor-not-allowed opacity-50 bg-gray-100 border-gray-200"
            : "cursor-pointer"
        }
        ${
          selected
            ? "border-2 border-[#F59E0B] bg-[#F59E0B]/10 shadow-sm"
            : "border-2 border-gray-200 bg-white hover:border-gray-300"
        }
      `}
    >
      {/* Top Right Circle */}
      <div
        className={`
          absolute right-4 top-4 h-5 w-5 rounded-full border flex items-center justify-center
          ${selected ? "bg-[#F59E0B] border-[#F59E0B]" : "border-gray-300"}
        `}
      >
        {selected && <FaCheck className="text-white text-xs" />}
      </div>

      {/* Icon */}
      <div
        className={`
          mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-xl
          ${
            selected
              ? "bg-[#FDECCC] text-[#F2A413]"
              : "bg-[#C9DFE4] text-[#2C6176]"
          }
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <h3 className="font-exo font-bold text-[18px] lg:text-[20px] leading-[120%] tracking-normal">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {description}
      </p>

      {disabled && (
        <span className="mt-3 inline-block rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
          Coming Soon
        </span>
      )}
    </div>
  );
};

export default ServiceCard;