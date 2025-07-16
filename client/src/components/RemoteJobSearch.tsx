import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Star, 
  ExternalLink,
  RefreshCw,
  Bot,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import QuickApplyModal from './QuickApplyModal';

interface RemoteJob {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
  salary?: string;
  type: string;
  experience: string;
  skills: string[];
  sourceUrl: string;
  isRemote: boolean;
  matchScore: number;
  reasons: string[];
  recommendations: string[];
}

interface RemoteJobSearchProps {
  userId: number;
}

export default function RemoteJobSearch({ userId }: RemoteJobSearchProps) {
  const [searchResults, setSearchResults] = useState<{
    jobs: RemoteJob[];
    totalFound: number;
    searchTimestamp: Date;
  } | null>(null);
  const [selectedJob, setSelectedJob] = useState<RemoteJob | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing remote jobs from database
  const { data: existingRemoteJobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['/api/jobs', { isRemote: true }],
    queryFn: async () => {
      const response = await apiRequest('/api/jobs?isRemote=true');
      return response;
    }
  });

  // Search remote jobs mutation
  const searchRemoteJobsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/jobs/remote-search', 'POST', { userId });
      return response;
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setIsSearching(false);
      toast({
        title: "Search completed",
        description: `Found ${data.totalFound} remote jobs matching your profile.`
      });
    },
    onError: () => {
      setIsSearching(false);
      toast({
        title: "Search failed",
        description: "Failed to search for remote jobs. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Auto search mutation
  const autoSearchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/jobs/auto-search/${userId}`, 'POST');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/remote'] });
      refetchJobs();
      toast({
        title: "Auto search completed",
        description: "New remote jobs have been saved to your job feed."
      });
    },
    onError: () => {
      toast({
        title: "Auto search failed",
        description: "Failed to complete auto search. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSearch = () => {
    setIsSearching(true);
    searchRemoteJobsMutation.mutate();
  };

  const handleAutoSearch = () => {
    autoSearchMutation.mutate();
  };

  const handleApplyToJob = (job: RemoteJob) => {
    // Convert RemoteJob to Job format for the modal
    const jobForModal = {
      id: 0, // Temporary ID
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      requirements: job.requirements,
      salary: job.salary || '',
      type: job.type,
      experience: job.experience,
      skills: job.skills,
      source: 'AI Scraper',
      sourceUrl: job.sourceUrl,
      isActive: true,
      isRemote: job.isRemote,
      postedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMatchScoreText = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Partial Match';
  };

  return (
    <div className="space-y-6">
      {/* Header with search controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Powered Remote Job Search
          </CardTitle>
          <CardDescription>
            Find remote jobs that match your skills and experience using AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={handleSearch}
              disabled={isSearching || searchRemoteJobsMutation.isPending}
              className="flex-1"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Remote Jobs
                </>
              )}
            </Button>
            <Button 
              onClick={handleAutoSearch}
              disabled={autoSearchMutation.isPending}
              variant="outline"
            >
              {autoSearchMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Auto Searching...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Auto Search & Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Found {searchResults.totalFound} remote jobs on {searchResults.searchTimestamp.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* AI-Analyzed Jobs */}
      {searchResults && searchResults.jobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI-Analyzed Job Matches</h3>
          {searchResults.jobs.map((job, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <Badge variant="secondary">{job.company}</Badge>
                      <Badge variant="outline">Remote</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.experience}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress value={job.matchScore} className="w-20" />
                        <span className="text-sm font-medium">{job.matchScore}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getMatchScoreText(job.matchScore)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.skills.length - 5} more
                      </Badge>
                    )}
                  </div>

                  {/* AI Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Why this matches
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.reasons.slice(0, 3).map((reason, reasonIndex) => (
                          <li key={reasonIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-500" />
                        Recommendations
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.recommendations.slice(0, 3).map((rec, recIndex) => (
                          <li key={recIndex} className="flex items-start gap-2">
                            <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleApplyToJob(job)}
                      className="flex-1"
                    >
                      Quick Apply
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(job.sourceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Existing Remote Jobs */}
      {existingRemoteJobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Remote Jobs</h3>
          <div className="grid gap-4">
            {existingRemoteJobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <Badge variant="secondary">{job.company}</Badge>
                        <Badge variant="outline">Remote</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {job.experience}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {job.skills?.slice(0, 5).map((skill: string, skillIndex: number) => (
                        <Badge key={skillIndex} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.skills?.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.skills.length - 5} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleApplyToJob({
                          ...job,
                          matchScore: 0,
                          reasons: [],
                          recommendations: []
                        })}
                        className="flex-1"
                      >
                        Quick Apply
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.open(job.sourceUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Original
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Apply Modal */}
      {selectedJob && (
        <QuickApplyModal
          job={{
            id: 0,
            title: selectedJob.title,
            company: selectedJob.company,
            location: selectedJob.location,
            description: selectedJob.description,
            requirements: selectedJob.requirements,
            salary: selectedJob.salary || '',
            type: selectedJob.type,
            experience: selectedJob.experience,
            skills: selectedJob.skills,
            source: 'AI Scraper',
            sourceUrl: selectedJob.sourceUrl,
            isActive: true,
            isRemote: selectedJob.isRemote,
            postedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }}
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}