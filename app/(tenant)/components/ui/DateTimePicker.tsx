'use client';

import { useState, useRef, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import Calendar from "@/app/(tenant)/components/ui/Calendar";
import { ClockIcon, CalendarIcon } from "@/app/(tenant)/components/icons";

interface DateTimePickerProps {
    value: string;
    onChange: (value: string) => void;
    minDate?: Date;
    label?: string;
}

export default function DateTimePicker({ value, onChange, minDate, label = "Select Date & Time" }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse value or default to now
    const date = value ? new Date(value) : new Date();
    const validDate = isValid(date) ? date : new Date();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDateSelect = (newDate: Date) => {
        // Preserve time
        const updated = new Date(
            newDate.getFullYear(),
            newDate.getMonth(),
            newDate.getDate(),
            validDate.getHours(),
            validDate.getMinutes()
        );
        onChange(updated.toISOString());
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const updated = new Date(validDate);
        updated.setHours(hours);
        updated.setMinutes(minutes);
        onChange(updated.toISOString());
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>}

            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-3 w-full rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200
          ${isOpen
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
        `}
            >
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                        {format(validDate, 'EEEE, MMM do, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        at {format(validDate, 'h:mm a')}
                    </p>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-md ${isOpen ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    Change
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200 origin-top-left">

                    <div className="space-y-4">
                        {/* Calendar */}
                        <div className="p-2 bg-gray-50/50 rounded-xl border border-gray-100">
                            <Calendar
                                selectedDate={validDate}
                                onDateSelect={handleDateSelect}
                                minDate={minDate}
                            />
                        </div>

                        {/* Time Picker */}
                        <div className="pt-4 border-t border-gray-100">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Time
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="time"
                                        value={format(validDate, 'HH:mm')}
                                        onChange={handleTimeChange}
                                        className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2.5 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <ClockIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                <div className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-2.5 rounded-lg border border-gray-200 min-w-[60px] text-center">
                                    {format(validDate, 'a')}
                                </div>
                            </div>
                        </div>

                        {/* Done Button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
