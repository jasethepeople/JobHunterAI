import { Card, CardContent } from "@/components/ui/card";
import { Search, Send, Calendar, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    jobsFound: number;
    applications: number;
    interviews: number;
    responseRate: string;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const defaultStats = {
    jobsFound: 0,
    applications: 0,
    interviews: 0,
    responseRate: "0%"
  };

  const currentStats = stats || defaultStats;

  const cards = [
    {
      title: "Jobs Found",
      value: currentStats.jobsFound,
      icon: Search,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Applications",
      value: currentStats.applications,
      icon: Send,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Interviews",
      value: currentStats.interviews,
      icon: Calendar,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Response Rate",
      value: currentStats.responseRate,
      icon: TrendingUp,
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
