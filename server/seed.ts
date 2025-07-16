import { db } from "./db";
import { users, jobs, applications, communications, interviews, phoneNumbers } from "@shared/schema";

async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Create a sample user
    const [user] = await db.insert(users).values({
      username: "john_doe",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      location: "San Francisco, CA",
      skills: ["JavaScript", "TypeScript", "React", "Node.js", "Python"],
      experience: "5+ years of full-stack development experience",
      education: "Bachelor's in Computer Science"
    }).returning();

    // Create sample jobs
    const jobsData = [
      {
        title: "Senior Software Engineer",
        company: "TechCorp Inc.",
        location: "San Francisco, CA",
        description: "We're looking for a skilled Senior Software Engineer to join our dynamic team. You'll be responsible for designing and implementing scalable web applications, mentoring junior developers, and contributing to architectural decisions.",
        requirements: "5+ years of experience with React, Node.js, Python, and AWS. Strong problem-solving skills and experience with agile methodologies.",
        salary: "$120k - $180k",
        type: "Full-time",
        experience: "5+ years",
        skills: ["React", "Node.js", "Python", "AWS"],
        source: "Indeed",
        sourceUrl: "https://indeed.com/job/1",
        isActive: true
      },
      {
        title: "Frontend Developer",
        company: "WebDesign Co.",
        location: "Remote",
        description: "Join our creative team to build beautiful, responsive web applications. You'll work with modern frameworks and collaborate with designers to create exceptional user experiences.",
        requirements: "3+ years of frontend development experience with React, TypeScript, and modern CSS frameworks.",
        salary: "$90k - $130k",
        type: "Full-time",
        experience: "3+ years",
        skills: ["React", "TypeScript", "CSS", "HTML"],
        source: "Indeed",
        sourceUrl: "https://indeed.com/job/2",
        isActive: true
      }
    ];

    const insertedJobs = await db.insert(jobs).values(jobsData).returning();

    // Create sample applications
    const applicationsData = [
      {
        userId: user.id,
        jobId: insertedJobs[0].id,
        status: "submitted",
        resumeContent: "Sample resume content for senior engineer position",
        coverLetterContent: "Sample cover letter content for senior engineer position",
        notes: "Applied through company website. Heard back from recruiter."
      },
      {
        userId: user.id,
        jobId: insertedJobs[1].id,
        status: "interview",
        resumeContent: "Sample resume content for frontend position",
        coverLetterContent: "Sample cover letter content for frontend position",
        notes: "Phone screen scheduled for next week."
      }
    ];

    const insertedApplications = await db.insert(applications).values(applicationsData).returning();

    // Create sample phone numbers
    const phoneNumbersData = [
      {
        userId: user.id,
        phoneNumber: "+1 (555) 123-4567",
        type: "mobile",
        isVerified: true
      },
      {
        userId: user.id,
        phoneNumber: "+1 (555) 987-6543",
        type: "work",
        isVerified: false
      }
    ];

    await db.insert(phoneNumbers).values(phoneNumbersData);

    // Create sample communications
    const communicationsData = [
      {
        applicationId: insertedApplications[0].id,
        type: "call",
        subject: "Initial recruiter call",
        content: "Discussed role requirements and my background. Recruiter seemed interested and will schedule technical interview.",
        direction: "inbound" as const,
        isRead: true
      },
      {
        applicationId: insertedApplications[0].id,
        type: "email",
        subject: "Technical interview scheduled",
        content: "Technical interview scheduled for Friday at 2 PM PST via Zoom.",
        direction: "inbound" as const,
        isRead: false
      },
      {
        applicationId: insertedApplications[1].id,
        type: "call",
        subject: "Follow-up call",
        content: "Called to inquire about application status. HR said they're reviewing applications.",
        direction: "outbound" as const,
        isRead: true
      }
    ];

    await db.insert(communications).values(communicationsData);

    // Create sample interviews
    const interviewsData = [
      {
        applicationId: insertedApplications[0].id,
        interviewType: "video",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        interviewerName: "Sarah Johnson",
        location: "Zoom meeting",
        notes: "Technical interview with senior engineer",
        status: "scheduled"
      },
      {
        applicationId: insertedApplications[1].id,
        interviewType: "phone",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        interviewerName: "Mike Chen",
        location: "Phone call",
        notes: "Initial phone screen with hiring manager",
        status: "scheduled"
      }
    ];

    await db.insert(interviews).values(interviewsData);

    console.log("Database seeded successfully!");
    console.log(`Created user: ${user.username}`);
    console.log(`Created ${insertedJobs.length} jobs`);
    console.log(`Created ${insertedApplications.length} applications`);
    console.log(`Created ${phoneNumbersData.length} phone numbers`);
    console.log(`Created ${communicationsData.length} communications`);
    console.log(`Created ${interviewsData.length} interviews`);

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run the seeding function
seedDatabase();