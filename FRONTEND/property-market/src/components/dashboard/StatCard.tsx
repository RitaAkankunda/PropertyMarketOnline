import { Card } from "@/components/ui";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change?: string;
}

export function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && <p className="text-sm text-gray-500">{change}</p>}
        </div>
      </div>
    </Card>
  );
}