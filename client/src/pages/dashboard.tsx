import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import SearchFilters from "@/components/SearchFilters";
import JobCard from "@/components/JobCard";
import QuickApplyModal from "@/components/QuickApplyModal";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";
import type { Job } from "@shared/schema";

export default function Dashboard() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/jobs'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/stats/1'], // Using user ID 1 for demo
  });

  const handleQuickApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const handleSearch = (results: Job[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const displayJobs = isSearching ? searchResults : jobs;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Job Search</h2>
              <p className="text-slate-600">Find and apply to jobs with AI-powered assistance</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Search Filters */}
        <SearchFilters onSearch={handleSearch} />

        {/* Job Listings */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading jobs...</p>
            </div>
          ) : displayJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">No jobs found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            displayJobs.map((job) => (
              <JobCard key={job.id} job={job} onQuickApply={handleQuickApply} />
            ))
          )}
        </div>

        {/* Load More */}
        {displayJobs.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" className="px-6 py-3">
              Load More Jobs
            </Button>
          </div>
        )}
      </main>

      {/* Quick Apply Modal */}
      <QuickApplyModal
        job={selectedJob}
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />
    </div>
  );
}
