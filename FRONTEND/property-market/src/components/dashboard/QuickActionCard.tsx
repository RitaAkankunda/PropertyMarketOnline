import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  badge?: number;
}

export function QuickActionCard({ title, description, icon: Icon, href, color, badge }: QuickActionCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <Link href={href} className="block">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          {badge && badge > 0 && (
            <Badge variant="destructive" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </Link>
    </Card>
  );
}