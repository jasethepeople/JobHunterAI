import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Briefcase, Building, Wand2, Eye } from "lucide-react";
import type { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onQuickApply: (job: Job) => void;
}

export default function JobCard({ job, onQuickApply }: JobCardProps) {
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just posted";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getJobBadge = () => {
    const hoursSincePosted = (new Date().getTime() - new Date(job.postedAt || 0).getTime()) / (1000 * 60 * 60);
    if (hoursSincePosted < 24) return { label: "New", color: "bg-green-100 text-green-800" };
    if (job.salary && job.salary.includes("200k")) return { label: "Featured", color: "bg-blue-100 text-blue-800" };
    if (job.location.includes("Remote")) return { label: "Remote", color: "bg-yellow-100 text-yellow-800" };
    return null;
  };

  const badge = getJobBadge();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-slate-800">{job.title}</h3>
              {badge && (
                <Badge className={`text-xs font-medium ${badge.color}`}>
                  {badge.label}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mb-3">
              <p className="text-blue-600 font-medium">{job.company}</p>
              <div className="flex items-center text-slate-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formatTimeAgo(job.postedAt || new Date())}</span>
              </div>
            </div>
            
            <p className="text-slate-600 mb-4 line-clamp-2">
              {job.description}
            </p>
            
            <div className="flex items-center space-x-2 mb-4 flex-wrap">
              {job.skills?.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
              {job.skills && job.skills.length > 4 && (
                <Badge variant="secondary" className="text-sm">
                  +{job.skills.length - 4} more
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-600">
              {job.salary && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{job.salary}</span>
                </div>
              )}
              {job.type && (
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{job.type}</span>
                </div>
              )}
              {job.experience && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  <span>{job.experience}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-6">
            <Button 
              onClick={() => onQuickApply(job)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Quick Apply
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
