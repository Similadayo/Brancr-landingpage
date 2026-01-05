'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/(tenant)/components/icons";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    isEqual,
    isSameDay,
    isSameMonth,
    isToday,
    parse,
    startOfToday,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    addMonths,
    subMonths
} from 'date-fns';

interface CalendarProps {
    selectedDate?: Date;
    onDateSelect: (date: Date) => void;
    className?: string;
    minDate?: Date;
}

export default function Calendar({ selectedDate, onDateSelect, className = '', minDate }: CalendarProps) {
    const today = startOfToday();
    const [currentMonth, setCurrentMonth] = React.useState(format(today, 'MMM-yyyy'));
    const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });

    const previousMonth = () => {
        const firstDayNextMonth = subMonths(firstDayCurrentMonth, 1);
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
    };

    const nextMonth = () => {
        const firstDayNextMonth = addMonths(firstDayCurrentMonth, 1);
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
    };

    const handleDateClick = (day: Date) => {
        const isPast = minDate && day < minDate && !isSameDay(day, minDate);
        if (!isPast) {
            onDateSelect(day);
        }
    };

    return (
        <div className={`w-full max-w-md ${className}`}>
            <div className="flex items-center justify-between px-2 py-2">
                <h2 className="flex-auto text-sm font-semibold text-gray-900">
                    {format(firstDayCurrentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={previousMonth}
                        className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                    >
                        <span className="sr-only">Previous month</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="-my-1.5 -mr-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                    >
                        <span className="sr-only">Next month</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-7 text-center text-xs leading-6 text-gray-500 font-medium uppercase tracking-wide">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
            </div>
            <div className="mt-2 grid grid-cols-7 text-sm">
                {days.map((day, dayIdx) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
                    const isPast = minDate && day < minDate && !isSameDay(day, minDate) && !isToday(day);

                    return (
                        <div key={day.toString()} className={`${dayIdx > 6 && 'border-t border-gray-200'} py-2`}>
                            <button
                                type="button"
                                onClick={() => handleDateClick(day)}
                                disabled={!!isPast}
                                className={`
                  mx-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors
                  ${isSelected && 'text-white'}
                  ${!isSelected && isToday(day) && 'text-primary font-bold bg-primary/10'}
                  ${!isSelected && !isToday(day) && isCurrentMonth && !isPast && 'text-gray-900 hover:bg-gray-100'}
                  ${!isSelected && !isToday(day) && !isCurrentMonth && !isPast && 'text-gray-400 hover:bg-gray-100'}
                  ${isSelected && isToday(day) && 'bg-primary'}
                  ${isSelected && !isToday(day) && 'bg-gray-900'}
                  ${!isSelected && isPast && 'text-gray-300 cursor-not-allowed'}
                `}
                            >
                                <time dateTime={format(day, 'yyyy-MM-dd')}>
                                    {format(day, 'd')}
                                </time>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
