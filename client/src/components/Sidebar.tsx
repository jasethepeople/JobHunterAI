import { Link, useLocation } from "wouter";
import { Search, FileText, BarChart3, User, Settings, Briefcase, Globe } from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Job Search", href: "/", icon: Search },
    { name: "Remote Jobs", href: "/remote-jobs", icon: Globe },
    { name: "Applications", href: "/applications", icon: FileText },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <nav className="w-64 bg-white border-r border-slate-200 fixed left-0 top-0 h-full z-10">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">JobAI</h1>
        </div>
        
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive ? 'sidebar-active' : 'sidebar-inactive'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
