import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneCall, Plus, Check, X, MessageSquare, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PhoneNumber, Communication, Application } from '@shared/schema';

interface PhoneTrackerProps {
  userId: number;
  applicationId?: number;
}

export default function PhoneTracker({ userId, applicationId }: PhoneTrackerProps) {
  const [newPhone, setNewPhone] = useState('');
  const [newCommunication, setNewCommunication] = useState({
    type: 'call',
    subject: '',
    content: '',
    direction: 'outbound' as 'inbound' | 'outbound'
  });
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch phone numbers
  const { data: phoneNumbers = [] } = useQuery<PhoneNumber[]>({
    queryKey: ['/api/phone-numbers/user', userId],
    enabled: !!userId
  });

  // Fetch communications for application
  const { data: communications = [] } = useQuery<Communication[]>({
    queryKey: ['/api/communications/application', applicationId],
    enabled: !!applicationId
  });

  // Add phone number mutation
  const addPhoneMutation = useMutation({
    mutationFn: async (phoneData: { userId: number; phoneNumber: string; type: string }) => {
      const response = await apiRequest('/api/phone-numbers', 'POST', phoneData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/phone-numbers/user', userId] });
      setNewPhone('');
      setShowAddPhone(false);
      toast({
        title: "Phone number added",
        description: "Your phone number has been added for tracking."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add phone number.",
        variant: "destructive"
      });
    }
  });

  // Add communication mutation
  const addCommunicationMutation = useMutation({
    mutationFn: async (commData: any) => {
      const response = await apiRequest('/api/communications', 'POST', commData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/application', applicationId] });
      setNewCommunication({
        type: 'call',
        subject: '',
        content: '',
        direction: 'outbound'
      });
      setShowAddCommunication(false);
      toast({
        title: "Communication logged",
        description: "Your phone communication has been recorded."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log communication.",
        variant: "destructive"
      });
    }
  });

  // Mark communication as read
  const markReadMutation = useMutation({
    mutationFn: async (communicationId: number) => {
      await apiRequest(`/api/communications/${communicationId}/read`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communications/application', applicationId] });
    }
  });

  const handleAddPhone = () => {
    if (!newPhone.trim()) return;
    
    addPhoneMutation.mutate({
      userId,
      phoneNumber: newPhone.trim(),
      type: 'mobile'
    });
  };

  const handleAddCommunication = () => {
    if (!newCommunication.subject.trim() || !applicationId) return;
    
    addCommunicationMutation.mutate({
      applicationId,
      type: newCommunication.type,
      subject: newCommunication.subject,
      content: newCommunication.content,
      direction: newCommunication.direction,
      isRead: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Phone Numbers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Phone Numbers
          </CardTitle>
          <CardDescription>
            Track and manage your contact phone numbers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phoneNumbers.map((phone) => (
              <div key={phone.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{phone.phoneNumber}</div>
                  <div className="text-sm text-muted-foreground">
                    {phone.type} • Added {formatDate(phone.createdAt)}
                  </div>
                </div>
                <Badge variant={phone.isVerified ? 'default' : 'secondary'}>
                  {phone.isVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            ))}
            
            {showAddPhone ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                  <Button onClick={handleAddPhone} size="sm" disabled={addPhoneMutation.isPending}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setShowAddPhone(false)} variant="outline" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAddPhone(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Phone Number
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Communications Section */}
      {applicationId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Phone Communications
            </CardTitle>
            <CardDescription>
              Log and track phone calls and messages for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communications.filter(comm => comm.type === 'call' || comm.type === 'sms').map((comm) => (
                <div key={comm.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={comm.direction === 'inbound' ? 'default' : 'secondary'}>
                        {comm.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                      </Badge>
                      <Badge variant="outline">
                        {comm.type === 'call' ? 'Call' : 'SMS'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(comm.receivedAt)}
                      </span>
                    </div>
                    <div className="font-medium mb-1">{comm.subject}</div>
                    {comm.content && (
                      <div className="text-sm text-muted-foreground">{comm.content}</div>
                    )}
                  </div>
                  {!comm.isRead && (
                    <Button
                      onClick={() => markReadMutation.mutate(comm.id)}
                      variant="outline"
                      size="sm"
                    >
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
              
              {showAddCommunication ? (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="comm-type">Type</Label>
                      <Select value={newCommunication.type} onValueChange={(value) => 
                        setNewCommunication(prev => ({ ...prev, type: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="sms">SMS Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="comm-direction">Direction</Label>
                      <Select value={newCommunication.direction} onValueChange={(value: 'inbound' | 'outbound') => 
                        setNewCommunication(prev => ({ ...prev, direction: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">Incoming</SelectItem>
                          <SelectItem value="outbound">Outgoing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comm-subject">Subject</Label>
                    <Input
                      id="comm-subject"
                      value={newCommunication.subject}
                      onChange={(e) => setNewCommunication(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Call/message subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comm-content">Content/Notes</Label>
                    <Input
                      id="comm-content"
                      value={newCommunication.content}
                      onChange={(e) => setNewCommunication(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Details of the conversation"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCommunication} disabled={addCommunicationMutation.isPending}>
                      <Check className="h-4 w-4 mr-2" />
                      Log Communication
                    </Button>
                    <Button onClick={() => setShowAddCommunication(false)} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAddCommunication(true)} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Phone Communication
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}