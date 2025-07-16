import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Search, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";

interface SearchFiltersProps {
  onSearch: (results: Job[]) => void;
}

export default function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("20");
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/jobs/search", {
        query: searchQuery,
        location,
        radius: parseInt(radius)
      });
      return response.json();
    },
    onSuccess: (data) => {
      onSearch(data);
      toast({
        title: "Search completed",
        description: `Found ${data.length} jobs matching your criteria`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a job title or keywords",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setLocation("");
    setRadius("20");
    onSearch([]);
  };

  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <Label htmlFor="search" className="text-sm font-medium text-slate-700">
                Job Title or Keywords
              </Label>
              <div className="relative mt-2">
                <Input
                  id="search"
                  type="text"
                  placeholder="e.g. Software Engineer, Marketing Manager"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                Location
              </Label>
              <div className="relative mt-2">
                <Input
                  id="location"
                  type="text"
                  placeholder="Enter city or ZIP code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="radius" className="text-sm font-medium text-slate-700">
                Radius
              </Label>
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="20">20 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <Button 
                type="submit" 
                disabled={searchMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {searchMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClearFilters}
                disabled={searchMutation.isPending}
              >
                Clear Filters
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-apply" className="text-sm text-slate-600">
                Auto-apply enabled
              </Label>
              <Switch
                id="auto-apply"
                checked={autoApplyEnabled}
                onCheckedChange={setAutoApplyEnabled}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
