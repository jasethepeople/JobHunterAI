import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  location: text("location"),
  skills: text("skills").array(),
  experience: text("experience"),
  education: text("education"),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  salary: text("salary"),
  type: text("type"), // "Full-time", "Part-time", "Contract"
  experience: text("experience"), // "2+ years", "5+ years"
  skills: text("skills").array(),
  postedAt: timestamp("posted_at").defaultNow(),
  source: text("source").default("Indeed"),
  sourceUrl: text("source_url"),
  isActive: boolean("is_active").default(true),
  isRemote: boolean("is_remote").default(false),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  jobId: integer("job_id").references(() => jobs.id),
  status: text("status").notNull().default("pending"), // "pending", "submitted", "interview", "rejected", "accepted"
  appliedAt: timestamp("applied_at").defaultNow(),
  resumeContent: text("resume_content"),
  coverLetterContent: text("cover_letter_content"),
  followUpDate: timestamp("follow_up_date"),
  notes: text("notes"),
});

// New tables for monitoring and tracking
export const phoneNumbers = pgTable("phone_numbers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  type: text("type").notNull(), // "email", "phone", "text", "notification"
  direction: text("direction").notNull(), // "inbound", "outbound"
  content: text("content"),
  fromContact: text("from_contact"),
  toContact: text("to_contact"),
  subject: text("subject"),
  isRead: boolean("is_read").default(false),
  receivedAt: timestamp("received_at").defaultNow(),
  metadata: text("metadata"), // JSON string for additional data
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  interviewType: text("interview_type").notNull(), // "phone", "video", "in-person"
  location: text("location"), // Physical address or meeting link
  interviewerName: text("interviewer_name"),
  interviewerEmail: text("interviewer_email"),
  interviewerPhone: text("interviewer_phone"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled", "rescheduled"
  notes: text("notes"),
  duration: integer("duration"), // Duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  applicationId: integer("application_id").references(() => applications.id),
  type: text("type").notNull(), // "interview_reminder", "follow_up", "status_update", "response_received"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  scheduledFor: timestamp("scheduled_for"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  applications: many(applications),
  phoneNumbers: many(phoneNumbers),
  notifications: many(notifications),
}));

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  communications: many(communications),
  interviews: many(interviews),
  notifications: many(notifications),
}));

export const phoneNumbersRelations = relations(phoneNumbers, ({ one }) => ({
  user: one(users, { fields: [phoneNumbers.userId], references: [users.id] }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  application: one(applications, { fields: [communications.applicationId], references: [applications.id] }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, { fields: [interviews.applicationId], references: [applications.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  application: one(applications, { fields: [notifications.applicationId], references: [applications.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  location: true,
  skills: true,
  experience: true,
  education: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  postedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
});

export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  receivedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const jobSearchSchema = z.object({
  query: z.string().min(1),
  location: z.string().min(1),
  radius: z.number().min(1).max(100),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type JobSearch = z.infer<typeof jobSearchSchema>;
