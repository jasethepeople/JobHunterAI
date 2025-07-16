import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Plus, Edit2, MapPin, Phone, Video } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Interview, Application } from '@shared/schema';

interface InterviewTrackerProps {
  userId: number;
  applicationId?: number;
}

export default function InterviewTracker({ userId, applicationId }: InterviewTrackerProps) {
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [newInterview, setNewInterview] = useState({
    interviewType: 'phone',
    scheduledAt: '',
    interviewerName: '',
    location: '',
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch interviews for application
  const { data: interviews = [] } = useQuery<Interview[]>({
    queryKey: ['/api/interviews/application', applicationId],
    enabled: !!applicationId
  });

  // Fetch upcoming interviews for user
  const { data: upcomingInterviews = [] } = useQuery<Interview[]>({
    queryKey: ['/api/interviews/upcoming', userId],
    enabled: !!userId
  });

  // Add interview mutation
  const addInterviewMutation = useMutation({
    mutationFn: async (interviewData: any) => {
      const response = await apiRequest('/api/interviews', 'POST', interviewData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/upcoming', userId] });
      resetForm();
      toast({
        title: "Interview scheduled",
        description: "Your interview has been added to the schedule."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule interview.",
        variant: "destructive"
      });
    }
  });

  // Update interview mutation
  const updateInterviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/interviews/${id}`, 'PUT', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews/upcoming', userId] });
      setEditingInterview(null);
      resetForm();
      toast({
        title: "Interview updated",
        description: "Interview details have been updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update interview.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setNewInterview({
      interviewType: 'phone',
      scheduledAt: '',
      interviewerName: '',
      location: '',
      notes: ''
    });
    setShowAddInterview(false);
    setEditingInterview(null);
  };

  const handleAddInterview = () => {
    if (!newInterview.scheduledAt || !applicationId) return;
    
    addInterviewMutation.mutate({
      applicationId,
      interviewType: newInterview.interviewType,
      scheduledAt: new Date(newInterview.scheduledAt).toISOString(),
      interviewerName: newInterview.interviewerName || null,
      location: newInterview.location || null,
      notes: newInterview.notes || null,
      status: 'scheduled'
    });
  };

  const handleUpdateInterview = () => {
    if (!editingInterview || !newInterview.scheduledAt) return;
    
    updateInterviewMutation.mutate({
      id: editingInterview.id,
      data: {
        interviewType: newInterview.interviewType,
        scheduledAt: new Date(newInterview.scheduledAt).toISOString(),
        interviewerName: newInterview.interviewerName || null,
        location: newInterview.location || null,
        notes: newInterview.notes || null,
        status: 'scheduled'
      }
    });
  };

  const startEditingInterview = (interview: Interview) => {
    setEditingInterview(interview);
    setNewInterview({
      interviewType: interview.interviewType,
      scheduledAt: new Date(interview.scheduledAt).toISOString().slice(0, 16),
      interviewerName: interview.interviewerName || '',
      location: interview.location || '',
      notes: interview.notes || ''
    });
    setShowAddInterview(true);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'in-person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Interviews
          </CardTitle>
          <CardDescription>
            Your scheduled interviews across all applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingInterviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No upcoming interviews scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getInterviewIcon(interview.interviewType)}
                      <Badge variant={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)}
                      </span>
                    </div>
                    <div className="font-medium mb-1">
                      {formatDateTime(interview.scheduledAt)}
                    </div>
                    {interview.interviewerName && (
                      <div className="text-sm text-muted-foreground">
                        with {interview.interviewerName}
                      </div>
                    )}
                    {interview.location && (
                      <div className="text-sm text-muted-foreground">
                        at {interview.location}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => startEditingInterview(interview)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Interviews */}
      {applicationId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interview History
            </CardTitle>
            <CardDescription>
              All interviews for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getInterviewIcon(interview.interviewType)}
                      <Badge variant={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {interview.interviewType.charAt(0).toUpperCase() + interview.interviewType.slice(1)}
                      </span>
                    </div>
                    <div className="font-medium mb-1">
                      {formatDateTime(interview.scheduledAt)}
                    </div>
                    {interview.interviewerName && (
                      <div className="text-sm text-muted-foreground mb-1">
                        with {interview.interviewerName}
                      </div>
                    )}
                    {interview.location && (
                      <div className="text-sm text-muted-foreground mb-1">
                        at {interview.location}
                      </div>
                    )}
                    {interview.notes && (
                      <div className="text-sm text-muted-foreground">
                        {interview.notes}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => startEditingInterview(interview)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {showAddInterview ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interview-type">Interview Type</Label>
                      <Select value={newInterview.interviewType} onValueChange={(value) => 
                        setNewInterview(prev => ({ ...prev, interviewType: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Phone Interview</SelectItem>
                          <SelectItem value="video">Video Interview</SelectItem>
                          <SelectItem value="in-person">In-Person Interview</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scheduled-at">Scheduled Date & Time</Label>
                      <Input
                        id="scheduled-at"
                        type="datetime-local"
                        value={newInterview.scheduledAt}
                        onChange={(e) => setNewInterview(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="interviewer-name">Interviewer Name</Label>
                    <Input
                      id="interviewer-name"
                      value={newInterview.interviewerName}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, interviewerName: e.target.value }))}
                      placeholder="Name of the interviewer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location/Link</Label>
                    <Input
                      id="location"
                      value={newInterview.location}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Address, meeting room, or video link"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newInterview.notes}
                      onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the interview"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={editingInterview ? handleUpdateInterview : handleAddInterview}
                      disabled={addInterviewMutation.isPending || updateInterviewMutation.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {editingInterview ? 'Update Interview' : 'Schedule Interview'}
                    </Button>
                    <Button onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAddInterview(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}