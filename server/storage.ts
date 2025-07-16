import { 
  users, jobs, applications, communications, interviews, notifications, phoneNumbers,
  type User, type InsertUser, type Job, type InsertJob, type Application, type InsertApplication,
  type Communication, type InsertCommunication, type Interview, type InsertInterview,
  type Notification, type InsertNotification, type PhoneNumber, type InsertPhoneNumber
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobs(limit?: number, offset?: number, isRemote?: boolean): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  searchJobs(query: string, location: string, radius: number): Promise<Job[]>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByUserId(userId: number): Promise<Application[]>;
  getApplicationsByJobId(jobId: number): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined>;
  
  // Communication operations
  getCommunication(id: number): Promise<Communication | undefined>;
  getCommunicationsByApplicationId(applicationId: number): Promise<Communication[]>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  markCommunicationAsRead(id: number): Promise<void>;
  
  // Interview operations
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviewsByApplicationId(applicationId: number): Promise<Interview[]>;
  getUpcomingInterviews(userId: number): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview | undefined>;
  
  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Phone number operations
  getPhoneNumbersByUserId(userId: number): Promise<PhoneNumber[]>;
  createPhoneNumber(phoneNumber: InsertPhoneNumber): Promise<PhoneNumber>;
  verifyPhoneNumber(id: number): Promise<void>;
  
  // Stats
  getApplicationStats(userId: number): Promise<{
    totalApplications: number;
    pendingApplications: number;
    interviews: number;
    responseRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getJobs(limit: number = 50, offset: number = 0, isRemote?: boolean): Promise<Job[]> {
    const conditions = [eq(jobs.isActive, true)];
    
    if (isRemote !== undefined) {
      conditions.push(eq(jobs.isRemote, isRemote));
    }
    
    return await db.select().from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.postedAt))
      .limit(limit)
      .offset(offset);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async searchJobs(query: string, location: string, radius: number): Promise<Job[]> {
    return await db.select().from(jobs)
      .where(and(
        eq(jobs.isActive, true),
        or(
          like(jobs.title, `%${query}%`),
          like(jobs.description, `%${query}%`)
        ),
        location ? like(jobs.location, `%${location}%`) : undefined
      ))
      .orderBy(desc(jobs.postedAt));
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application || undefined;
  }

  async getApplicationsByUserId(userId: number): Promise<Application[]> {
    return await db.select().from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByJobId(jobId: number): Promise<Application[]> {
    return await db.select().from(applications)
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.appliedAt));
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const [application] = await db.insert(applications).values(insertApplication).returning();
    return application;
  }

  async updateApplication(id: number, updateData: Partial<InsertApplication>): Promise<Application | undefined> {
    const [application] = await db.update(applications).set(updateData).where(eq(applications.id, id)).returning();
    return application || undefined;
  }

  async getCommunication(id: number): Promise<Communication | undefined> {
    const [communication] = await db.select().from(communications).where(eq(communications.id, id));
    return communication || undefined;
  }

  async getCommunicationsByApplicationId(applicationId: number): Promise<Communication[]> {
    return await db.select().from(communications)
      .where(eq(communications.applicationId, applicationId))
      .orderBy(desc(communications.receivedAt));
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    const [communication] = await db.insert(communications).values(insertCommunication).returning();
    return communication;
  }

  async markCommunicationAsRead(id: number): Promise<void> {
    await db.update(communications).set({ isRead: true }).where(eq(communications.id, id));
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview || undefined;
  }

  async getInterviewsByApplicationId(applicationId: number): Promise<Interview[]> {
    return await db.select().from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(asc(interviews.scheduledAt));
  }

  async getUpcomingInterviews(userId: number): Promise<Interview[]> {
    const result = await db.select({ interviews }).from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .where(and(
        eq(applications.userId, userId),
        eq(interviews.status, 'scheduled')
      ))
      .orderBy(asc(interviews.scheduledAt));
    
    return result.map(r => r.interviews);
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const [interview] = await db.insert(interviews).values(insertInterview).returning();
    return interview;
  }

  async updateInterview(id: number, updateData: Partial<InsertInterview>): Promise<Interview | undefined> {
    const [interview] = await db.update(interviews).set(updateData).where(eq(interviews.id, id)).returning();
    return interview || undefined;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getPhoneNumbersByUserId(userId: number): Promise<PhoneNumber[]> {
    return await db.select().from(phoneNumbers)
      .where(eq(phoneNumbers.userId, userId))
      .orderBy(desc(phoneNumbers.createdAt));
  }

  async createPhoneNumber(insertPhoneNumber: InsertPhoneNumber): Promise<PhoneNumber> {
    const [phoneNumber] = await db.insert(phoneNumbers).values(insertPhoneNumber).returning();
    return phoneNumber;
  }

  async verifyPhoneNumber(id: number): Promise<void> {
    await db.update(phoneNumbers).set({ isVerified: true }).where(eq(phoneNumbers.id, id));
  }

  async getApplicationStats(userId: number): Promise<{
    totalApplications: number;
    pendingApplications: number;
    interviews: number;
    responseRate: number;
  }> {
    const userApplications = await this.getApplicationsByUserId(userId);
    const totalApplications = userApplications.length;
    const pendingApplications = userApplications.filter(app => app.status === "pending").length;
    const interviewCount = userApplications.filter(app => app.status === "interview").length;
    const responseRate = totalApplications > 0 ? 
      Math.round(((totalApplications - pendingApplications) / totalApplications) * 100) : 0;
    
    return {
      totalApplications,
      pendingApplications,
      interviews: interviewCount,
      responseRate
    };
  }
}

export const storage = new DatabaseStorage();