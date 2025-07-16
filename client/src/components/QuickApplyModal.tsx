import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Eye, Send, X, Check, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

interface QuickApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickApplyModal({ job, isOpen, onClose }: QuickApplyModalProps) {
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [trackStatus, setTrackStatus] = useState(true);
  const [setReminder, setSetReminder] = useState(false);
  const [aiStatus, setAiStatus] = useState("Ready to analyze job requirements...");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applicationMutation = useMutation({
    mutationFn: async () => {
      if (!job) throw new Error("No job selected");
      
      setAiStatus("Analyzing job requirements...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAiStatus("Generating tailored resume...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAiStatus("Creating personalized cover letter...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAiStatus("Finalizing application...");
      
      const response = await apiRequest("POST", "/api/applications", {
        userId: 1, // Using user ID 1 for demo
        jobId: job.id,
        status: "submitted",
        followUpDate: followUpEnabled ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        notes: setReminder ? "Interview reminder set" : null
      });
      
      return response.json();
    },
    onSuccess: () => {
      setAiStatus("Application submitted successfully!");
      toast({
        title: "Application submitted!",
        description: "Your AI-powered application has been sent successfully.",
      });
      
      // Invalidate and refetch stats
      queryClient.invalidateQueries({ queryKey: ['/api/stats/1'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/user/1'] });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error) => {
      setAiStatus("Application failed. Please try again.");
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    applicationMutation.mutate();
  };

  const aiSteps = [
    { label: "Job description parsed", completed: applicationMutation.isPending || applicationMutation.isSuccess },
    { label: "Resume tailored for position", completed: applicationMutation.isPending || applicationMutation.isSuccess },
    { label: "Cover letter generated", completed: applicationMutation.isPending || applicationMutation.isSuccess },
    { label: "Ready to submit", completed: applicationMutation.isSuccess }
  ];

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Quick Apply with AI
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Summary */}
          <Card className="bg-slate-50">
            <CardContent className="pt-4">
              <h4 className="font-semibold text-slate-800 mb-2">Applying for:</h4>
              <div className="flex items-center space-x-3">
                <h5 className="text-lg font-medium text-slate-800">{job.title}</h5>
                <span className="text-blue-600">@ {job.company}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">AI Assistant Status</h4>
                  <p className="text-sm text-slate-600">{aiStatus}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {aiSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 
                      applicationMutation.isPending ? 'bg-yellow-500 animate-pulse' : 
                      'bg-slate-300'
                    }`}>
                      {step.completed && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={`text-sm ${
                      step.completed ? 'text-slate-600' : 
                      applicationMutation.isPending ? 'text-slate-600' : 
                      'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Generated Documents Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tailored Resume</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>✓ Highlighted relevant skills</p>
                  <p>✓ Emphasized leadership roles</p>
                  <p>✓ Added matching keywords</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Cover Letter</CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 space-y-2">
                  <p>✓ Personalized for {job.company}</p>
                  <p>✓ Matches job requirements</p>
                  <p>✓ Professional tone & format</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Application Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="followUp" 
                    checked={followUpEnabled}
                    onCheckedChange={setFollowUpEnabled}
                  />
                  <label htmlFor="followUp" className="text-sm text-slate-700">
                    Send follow-up email in 1 week
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="trackStatus" 
                    checked={trackStatus}
                    onCheckedChange={setTrackStatus}
                  />
                  <label htmlFor="trackStatus" className="text-sm text-slate-700">
                    Track application status
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="setReminder" 
                    checked={setReminder}
                    onCheckedChange={setSetReminder}
                  />
                  <label htmlFor="setReminder" className="text-sm text-slate-700">
                    Set interview reminder
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={applicationMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={applicationMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {applicationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
