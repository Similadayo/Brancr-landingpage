"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDownIcon, MagnifyingGlassIcon, CheckCircleIcon } from "@/app/(tenant)/components/icons";

type Country = {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
};

// Common countries list - expanded for better search demo
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
    { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
    { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
    { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
];

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    label?: string;
}

export function PhoneInput({ value, onChange, className, id, label = "Phone number*", ...props }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize selected country from value if exists
    useEffect(() => {
        if (value) {
            // Find country matching the start of the value (dial code)
            // Sort by length desc so +1 doesn't match +123 before +123 matches
            const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
            const match = sortedCountries.find(c => value.startsWith(c.dialCode));
            if (match) {
                setSelectedCountry(match);
            }
        }
    }, [value]);

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
        if (!isOpen) {
            setSearchQuery(""); // Reset search on close
        }
    }, [isOpen]);

    const filteredCountries = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return COUNTRIES.filter(country =>
            country.name.toLowerCase().includes(query) ||
            country.dialCode.includes(query) ||
            country.code.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        // Replace old prefix or add new one
        // Remove old dial code if present
        let cleanNumber = value;
        // Check if value currently starts with a known dial code, if so replace it
        // Otherwise just prepend
        const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
        const currentMatch = sortedCountries.find(c => value.startsWith(c.dialCode));

        if (currentMatch) {
            cleanNumber = value.slice(currentMatch.dialCode.length);
        } else {
            // strip any non-numeric from start if it looks like a prefix
            // simplistic approach: just use value as is (user might have typed raw number)
        }

        // Clean leading whitespace
        cleanNumber = cleanNumber.trim();

        onChange(`${country.dialCode} ${cleanNumber}`);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        onChange(input);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Container */}
            <div
                className={`relative flex items-center rounded-xl border border-gray-200 bg-white transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:bg-dark-surface dark:border-dark-border ${className}`}
            >
                {/* Flag Selector Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-14 items-center gap-2 pl-4 pr-3 border-r border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-dark-elevated rounded-l-xl transition-colors shrink-0"
                >
                    <span className="text-2xl leading-none">{selectedCountry.flag}</span>
                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Input Area */}
                <div className="flex-1 relative h-14 min-w-0">
                    <label
                        htmlFor={id}
                        className="absolute left-3 top-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider pointer-events-none"
                    >
                        {label}
                    </label>
                    <input
                        {...props}
                        id={id}
                        type="tel"
                        value={value}
                        onChange={handlePhoneChange}
                        className="h-full w-full bg-transparent px-3 pt-4 pb-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
                        placeholder={`${selectedCountry.dialCode} 123 456 7890`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-2 w-72 origin-top-left overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 dark:bg-dark-surface dark:border-dark-border">
                    {/* Search Header */}
                    <div className="border-b border-gray-100 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-dark-elevated">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search for countries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-dark-surface dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Country List */}
                    <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => {
                                const isSelected = selectedCountry.code === country.code;
                                return (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => handleCountrySelect(country)}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected
                                                ? "bg-primary/5 text-primary dark:bg-primary/20"
                                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-dark-elevated"
                                            }`}
                                    >
                                        <span className="text-xl">{country.flag}</span>
                                        <span className="flex-1 truncate font-medium">{country.name}</span>
                                        <span className={`text-xs ${isSelected ? "text-primary/70" : "text-gray-400"}`}>
                                            ({country.dialCode})
                                        </span>
                                        {isSelected && <CheckCircleIcon className="h-4 w-4 text-primary" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-sm text-gray-500">No countries found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
