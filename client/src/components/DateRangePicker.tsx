import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = ""
}: DateRangePickerProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="flex-1">
        <Label htmlFor="start-date" className="text-xs text-slate-600 mb-1 block">
          Desde
        </Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="bg-white"
        />
      </div>
      <div className="flex-1">
        <Label htmlFor="end-date" className="text-xs text-slate-600 mb-1 block">
          Hasta
        </Label>
        <Input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          min={startDate}
          className="bg-white"
        />
      </div>
    </div>
  );
}
