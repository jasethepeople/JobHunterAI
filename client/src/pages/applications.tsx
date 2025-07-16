import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Building, MapPin, Clock, Eye, Phone, Users, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import PhoneTracker from "@/components/PhoneTracker";
import InterviewTracker from "@/components/InterviewTracker";
import type { Application } from "@shared/schema";

export default function Applications() {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [expandedApplication, setExpandedApplication] = useState<number | null>(null);
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['/api/applications/user/1'], // Using user ID 1 for demo
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpansion = (applicationId: number) => {
    setExpandedApplication(expandedApplication === applicationId ? null : applicationId);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">My Applications</h2>
              <p className="text-slate-600">Track your job applications, communications, and interviews</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-slate-600">No applications yet. Start applying to jobs!</p>
                  <Button className="mt-4">Browse Jobs</Button>
                </CardContent>
              </Card>
            ) : (
              applications.map((application: Application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl">Job Application #{application.id}</CardTitle>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Applied on {formatDate(application.appliedAt!)}
                          </div>
                          {application.followUpDate && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Follow up on {formatDate(application.followUpDate)}
                            </div>
                          )}
                        </div>

                        {application.notes && (
                          <div className="bg-slate-50 rounded-lg p-3 mt-3">
                            <p className="text-sm text-slate-700">{application.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Resume
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Cover Letter
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleExpansion(application.id)}
                        >
                          {expandedApplication === application.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {expandedApplication === application.id && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        <Tabs defaultValue="communications" className="w-full">
                          <TabsList className="mb-4">
                            <TabsTrigger value="communications">
                              <Phone className="h-4 w-4 mr-2" />
                              Communications
                            </TabsTrigger>
                            <TabsTrigger value="interviews">
                              <Users className="h-4 w-4 mr-2" />
                              Interviews
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="communications">
                            <PhoneTracker userId={1} applicationId={application.id} />
                          </TabsContent>
                          <TabsContent value="interviews">
                            <InterviewTracker userId={1} applicationId={application.id} />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="communications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  All Communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhoneTracker userId={1} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewTracker userId={1} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
