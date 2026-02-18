"use client"

import * as React from "react"
import { addDays, format, startOfYear, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
}

export function DateRangePicker({
    date,
    setDate,
    className,
}: DateRangePickerProps) {
    const [preset, setPreset] = React.useState<string>("CUSTOM")

    const handlePresetChange = (value: string) => {
        setPreset(value)
        const today = new Date()

        switch (value) {
            case "TODAY":
                setDate({ from: today, to: today })
                break
            case "YESTERDAY":
                const yesterday = subDays(today, 1)
                setDate({ from: yesterday, to: yesterday })
                break
            case "LAST_7_DAYS":
                setDate({ from: subDays(today, 6), to: today })
                break
            case "LAST_30_DAYS":
                setDate({ from: subDays(today, 29), to: today })
                break
            case "THIS_MONTH":
                setDate({ from: startOfMonth(today), to: endOfMonth(today) })
                break
            case "LAST_MONTH":
                const lastMonth = subMonths(today, 1)
                setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
                break
            case "LAST_3_MONTHS":
                setDate({ from: subMonths(today, 3), to: today })
                break
            case "LAST_6_MONTHS":
                setDate({ from: subMonths(today, 6), to: today })
                break
            case "THIS_YEAR":
                setDate({ from: startOfYear(today), to: today })
                break
            case "ALL_TIME":
                // Assuming a reasonable start date, e.g., Jan 1, 2020
                setDate({ from: new Date(2020, 0, 1), to: today })
                break
            default:
                break
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <div className="flex items-center gap-2">
                    <Select value={preset} onValueChange={handlePresetChange}>
                        <SelectTrigger className="w-[160px] h-12 rounded-2xl md:rounded-[2rem] border-none shadow-inner bg-white dark:bg-slate-950 font-bold text-slate-600 dark:text-slate-300">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent align="start" className="rounded-2xl border-slate-200 dark:border-slate-800">
                            <SelectItem value="CUSTOM">Custom Range</SelectItem>
                            <SelectItem value="TODAY">Today</SelectItem>
                            <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                            <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                            <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                            <SelectItem value="THIS_MONTH">This Month</SelectItem>
                            <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                            <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
                            <SelectItem value="LAST_6_MONTHS">Last 6 Months</SelectItem>
                            <SelectItem value="THIS_YEAR">Year to Date</SelectItem>
                            <SelectItem value="ALL_TIME">All Time</SelectItem>
                        </SelectContent>
                    </Select>

                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"ghost"}
                            className={cn(
                                "w-fit justify-start text-left font-bold h-12 rounded-2xl md:rounded-[2rem] shadow-inner bg-white dark:bg-slate-950 border-none px-4",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                </div>
                <PopoverContent className="w-auto p-0 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={(newDate) => {
                            setDate(newDate)
                            setPreset("CUSTOM")
                        }}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
