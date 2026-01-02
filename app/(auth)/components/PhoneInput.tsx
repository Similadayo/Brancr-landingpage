"use client";

import { useState, useRef, useEffect } from "react";

type Country = {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
};

// Common countries list
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
];

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (value: string) => void;
    id?: string;
}

export function PhoneInput({ value, onChange, className, id, ...props }: PhoneInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initialize selected country from value if exists
    useEffect(() => {
        if (value) {
            const match = COUNTRIES.find(c => value.startsWith(c.dialCode));
            if (match) {
                setSelectedCountry(match);
            }
        }
    }, []); // Only run on mount to avoid overriding user selection while typing

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        // Replace old prefix or add new one
        const cleanNumber = value.replace(/^\+\d+\s*/, '');
        onChange(`${country.dialCode} ${cleanNumber}`);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Basic formatting: ensure it starts with dial code or just append to it
        // For simplicity in this component, we just pass the raw value, 
        // but a robust implementation would use libphonenumber-js
        onChange(input);
    };

    return (
        <div className="relative">
            <div className="flex">
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex h-full items-center gap-1 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-900 transition hover:bg-gray-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-gray-200 dark:hover:bg-dark-elevated"
                    >
                        <span className="text-lg leading-none">{selectedCountry.flag}</span>
                        <span className="text-gray-600 dark:text-gray-400">▼</span>
                    </button>

                    {isOpen && (
                        <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-dark-surface dark:border-dark-border">
                            {COUNTRIES.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => handleCountrySelect(country)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-dark-elevated dark:text-gray-200"
                                >
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="flex-1 truncate">{country.name}</span>
                                    <span className="text-gray-500">{country.dialCode}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <input
                    {...props}
                    id={id}
                    type="tel"
                    value={value}
                    onChange={handlePhoneChange}
                    className={`w-full rounded-r-xl border border-gray-200 border-l-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary ${className}`}
                    placeholder={selectedCountry.dialCode + " 801 234 5678"}
                />
            </div>
        </div>
    );
}
