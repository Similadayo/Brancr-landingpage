"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, CheckCircleIcon, MagnifyingGlassIcon } from "@/app/(tenant)/components/icons";

type Country = {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
};

// Common countries list with more options for search demo
const COUNTRIES: Country[] = [
    { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
    { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
    { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
    { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
    { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
    { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
    { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
    { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
    { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
    { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
    { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
    { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
    { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
    { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
    { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
    { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
];

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    id?: string;
}

export function PhoneInput({ value, onChange, className, id, ...props }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize selected country from value if exists
    useEffect(() => {
        if (value) {
            // Find the longest matching dial code to avoid partial matches (e.g. +1 vs +123)
            const match = COUNTRIES.filter(c => value.startsWith(c.dialCode))
                .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];

            if (match) {
                setSelectedCountry(match);
            }
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filteredCountries = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return COUNTRIES.filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.code.toLowerCase().includes(query) ||
            country.dialCode.includes(query)
        );
    }, [searchQuery]);

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery(""); // Reset search

        // Replace old prefix with new one intelligently
        // Remove current dial code if present at the start
        let cleanNumber = value;

        // Try to identify if the current value starts with the OLD selected country's code
        if (value.startsWith(selectedCountry.dialCode)) {
            cleanNumber = value.slice(selectedCountry.dialCode.length);
        } else {
            // Fallback: strip any leading plus and digits followed by space to try and clean it
            // But simpler is to just append if empty, or keep as is if not matching
        }

        // Trim leading spaces from the number part
        cleanNumber = cleanNumber.trim();

        onChange(`${country.dialCode} ${cleanNumber}`);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Unified Container resembling standard inputs */}
            <div className="flex w-full items-center rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 dark:bg-dark-surface dark:border-dark-border">

                {/* Country Selector Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex shrink-0 items-center gap-2 pl-4 pr-2 py-3 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                    <span className="text-xl leading-none">{selectedCountry.flag}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-gray-200 dark:bg-dark-border mx-1"></div>

                {/* Input Field */}
                <input
                    {...props}
                    id={id}
                    type="tel"
                    value={value}
                    onChange={handlePhoneChange}
                    className={`block w-full flex-1 border-0 bg-transparent py-3 pl-2 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-white ${className}`}
                    placeholder={selectedCountry.dialCode + " 801 234 5678"}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-[300px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-dark-surface dark:border-dark-border">
                    {/* Search Header */}
                    <div className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50/80 p-2 backdrop-blur-sm dark:bg-dark-elevated/80 dark:border-dark-border">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search country..."
                                className="w-full rounded-lg border-none bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 ring-1 ring-gray-200 focus:ring-2 focus:ring-primary/50 dark:bg-dark-surface dark:text-white dark:ring-dark-border"
                            />
                        </div>
                    </div>

                    {/* Country List */}
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => {
                                const isSelected = selectedCountry.code === country.code;
                                return (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
                                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isSelected
                                                ? "bg-primary/5 text-primary dark:bg-primary/20 dark:text-white"
                                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-elevated"
                                            }`}
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <span className="flex-1 truncate font-medium">{country.name}</span>
                                        <span className={`text-xs ${isSelected ? "text-primary dark:text-white" : "text-gray-500"}`}>
                                            {country.dialCode}
                                        </span>
                                        {isSelected && <CheckCircleIcon className="h-4 w-4 text-primary" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                No countries found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
