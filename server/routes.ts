import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  jobSearchSchema, insertApplicationSchema, insertUserSchema,
  insertCommunicationSchema, insertInterviewSchema, insertNotificationSchema,
  insertPhoneNumberSchema
} from "@shared/schema";
import { generateResume, generateCoverLetter, analyzeJobRequirements } from "./services/openai";
import { jobScraper } from "./services/jobScraper";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Job search endpoint
  app.post("/api/jobs/search", async (req, res) => {
    try {
      const { query, location, radius } = jobSearchSchema.parse(req.body);
      const jobs = await storage.searchJobs(query, location, radius);
      res.json(jobs);
    } catch (error) {
      res.status(400).json({ error: "Invalid search parameters" });
    }
  });

  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const isRemote = req.query.isRemote === 'true' ? true : 
                      req.query.isRemote === 'false' ? false : undefined;
      const jobs = await storage.getJobs(limit, offset, isRemote);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  // Real remote job scraping endpoint
  app.post("/api/jobs/remote-search", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      console.log(`Starting remote job search for user ${userId}`);
      const result = await jobScraper.searchAndAnalyzeRemoteJobs(userId);
      
      res.json(result);
    } catch (error) {
      console.error("Remote job search error:", error);
      res.status(500).json({ error: "Failed to search remote jobs" });
    }
  });

  // Auto-save scraped jobs to database
  app.post("/api/jobs/auto-save", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      await jobScraper.autoSearchAndSave(userId);
      res.json({ success: true, message: "Remote jobs search and save completed" });
    } catch (error) {
      console.error("Auto-save error:", error);
      res.status(500).json({ error: "Failed to auto-save jobs" });
    }
  });

  // Get specific job
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  // Create application with AI-generated documents
  app.post("/api/applications", async (req, res) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Get job details
      const job = await storage.getJob(applicationData.jobId!);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get user profile (assuming user ID 1 for demo)
      const user = await storage.getUser(applicationData.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate AI-powered resume and cover letter
      const [resume, coverLetter] = await Promise.all([
        generateResume(job.description + "\n\nRequirements: " + job.requirements, user),
        generateCoverLetter(job.description, job.company, job.title, user)
      ]);

      // Create application with generated documents
      const application = await storage.createApplication({
        ...applicationData,
        resumeContent: resume,
        coverLetterContent: coverLetter,
        status: "submitted"
      });

      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  // Get user applications
  app.get("/api/applications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const applications = await storage.getApplicationsByUserId(userId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  // Get application stats
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getApplicationStats(userId);
      const totalJobs = await storage.getJobs();
      
      res.json({
        jobsFound: totalJobs.length,
        applications: stats.totalApplications,
        interviews: stats.interviews,
        responseRate: `${stats.responseRate}%`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Analyze job requirements
  app.post("/api/jobs/:id/analyze", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const analysis = await analyzeJobRequirements(job.description + "\n\nRequirements: " + job.requirements);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing job:", error);
      res.status(500).json({ error: "Failed to analyze job requirements" });
    }
  });

  // Create or update user profile
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Communication tracking endpoints
  app.post("/api/communications", async (req, res) => {
    try {
      const communicationData = insertCommunicationSchema.parse(req.body);
      const communication = await storage.createCommunication(communicationData);
      res.json(communication);
    } catch (error) {
      res.status(400).json({ error: "Invalid communication data" });
    }
  });

  app.get("/api/communications/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const communications = await storage.getCommunicationsByApplicationId(applicationId);
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.put("/api/communications/:id/read", async (req, res) => {
    try {
      const communicationId = parseInt(req.params.id);
      await storage.markCommunicationAsRead(communicationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark communication as read" });
    }
  });

  // Interview tracking endpoints
  app.post("/api/interviews", async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(interviewData);
      res.json(interview);
    } catch (error) {
      res.status(400).json({ error: "Invalid interview data" });
    }
  });

  app.get("/api/interviews/application/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const interviews = await storage.getInterviewsByApplicationId(applicationId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch interviews" });
    }
  });

  app.get("/api/interviews/upcoming/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const interviews = await storage.getUpcomingInterviews(userId);
      res.json(interviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming interviews" });
    }
  });

  app.put("/api/interviews/:id", async (req, res) => {
    try {
      const interviewId = parseInt(req.params.id);
      const updateData = insertInterviewSchema.partial().parse(req.body);
      const interview = await storage.updateInterview(interviewId, updateData);
      if (!interview) {
        return res.status(404).json({ error: "Interview not found" });
      }
      res.json(interview);
    } catch (error) {
      res.status(400).json({ error: "Invalid interview data" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Phone number tracking endpoints
  app.post("/api/phone-numbers", async (req, res) => {
    try {
      const phoneNumberData = insertPhoneNumberSchema.parse(req.body);
      const phoneNumber = await storage.createPhoneNumber(phoneNumberData);
      res.json(phoneNumber);
    } catch (error) {
      res.status(400).json({ error: "Invalid phone number data" });
    }
  });

  app.get("/api/phone-numbers/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const phoneNumbers = await storage.getPhoneNumbersByUserId(userId);
      res.json(phoneNumbers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch phone numbers" });
    }
  });

  app.put("/api/phone-numbers/:id/verify", async (req, res) => {
    try {
      const phoneNumberId = parseInt(req.params.id);
      await storage.verifyPhoneNumber(phoneNumberId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify phone number" });
    }
  });

  // AI-powered remote job search endpoints
  app.post("/api/jobs/search-remote/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const result = await jobScraper.searchAndAnalyzeRemoteJobs(userId);
      res.json(result);
    } catch (error) {
      console.error("Error searching remote jobs:", error);
      res.status(500).json({ error: "Failed to search remote jobs" });
    }
  });

  app.post("/api/jobs/auto-search/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      await jobScraper.autoSearchAndSave(userId);
      res.json({ success: true, message: "Auto search completed" });
    } catch (error) {
      console.error("Error in auto search:", error);
      res.status(500).json({ error: "Failed to complete auto search" });
    }
  });

  app.get("/api/jobs/remote", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const allJobs = await storage.getJobs(limit * 2, offset); // Get more to filter
      const remoteJobs = allJobs.filter(job => job.isRemote || job.location?.toLowerCase().includes('remote'));
      res.json(remoteJobs.slice(0, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch remote jobs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
