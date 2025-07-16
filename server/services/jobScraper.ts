import OpenAI from "openai";
import { storage } from "../storage";
import type { InsertJob, User } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ScrapedJob {
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
}

interface JobAPIResponse {
  jobs: any[];
  total: number;
  hasMore: boolean;
}

// Real job scraping from multiple sources
export class JobScraper {
  private async fetchFromRemoteOK(): Promise<ScrapedJob[]> {
    try {
      // RemoteOK API - Free tier available
      const response = await fetch('https://remoteok.io/api', {
        headers: {
          'User-Agent': 'JobAI-Bot/1.0 (https://jobai.example.com)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`RemoteOK API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Skip the first item which is metadata
      const jobs = data.slice(1);
      
      return jobs.map((job: any) => ({
        title: job.position || 'Remote Position',
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        description: job.description || 'No description available',
        requirements: this.extractRequirements(job.description || ''),
        salary: job.salary_min && job.salary_max 
          ? `$${job.salary_min}k - $${job.salary_max}k`
          : undefined,
        type: job.contract_type || 'Full-time',
        experience: this.extractExperience(job.description || ''),
        skills: job.tags || [],
        sourceUrl: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
        isRemote: true
      }));
    } catch (error) {
      console.error('Error fetching from RemoteOK:', error);
      return [];
    }
  }

  private async fetchFromRemotelyJobs(): Promise<ScrapedJob[]> {
    try {
      // GitHub Jobs API alternative - using a free job board API
      const response = await fetch('https://jobs.github.com/positions.json?description=remote&full_time=true', {
        headers: {
          'User-Agent': 'JobAI-Bot/1.0 (https://jobai.example.com)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`GitHub Jobs API error: ${response.status}`);
      }
      
      const jobs = await response.json();
      
      return jobs.map((job: any) => ({
        title: job.title || 'Remote Position',
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        description: job.description || 'No description available',
        requirements: this.extractRequirements(job.description || ''),
        salary: undefined, // GitHub Jobs API doesn't include salary
        type: job.type || 'Full-time',
        experience: this.extractExperience(job.description || ''),
        skills: this.extractSkills(job.description || ''),
        sourceUrl: job.url || job.company_url || '',
        isRemote: true
      }));
    } catch (error) {
      console.error('Error fetching from GitHub Jobs:', error);
      return [];
    }
  }

  private async fetchFromWeworkRemotely(): Promise<ScrapedJob[]> {
    try {
      // We Work Remotely RSS feed parsing
      const response = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', {
        headers: {
          'User-Agent': 'JobAI-Bot/1.0 (https://jobai.example.com)',
        },
      });
      
      if (!response.ok) {
        throw new Error(`WeWorkRemotely RSS error: ${response.status}`);
      }
      
      const rssText = await response.text();
      
      // Parse RSS feed manually (simplified)
      const items = this.parseRSSFeed(rssText);
      
      return items.map((item: any) => ({
        title: item.title || 'Remote Position',
        company: this.extractCompanyFromTitle(item.title || ''),
        location: 'Remote',
        description: item.description || 'No description available',
        requirements: this.extractRequirements(item.description || ''),
        salary: undefined,
        type: 'Full-time',
        experience: this.extractExperience(item.description || ''),
        skills: this.extractSkills(item.description || ''),
        sourceUrl: item.link || '',
        isRemote: true
      }));
    } catch (error) {
      console.error('Error fetching from WeWorkRemotely:', error);
      return [];
    }
  }

  private parseRSSFeed(rssText: string): any[] {
    const items = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    let match;
    
    while ((match = itemRegex.exec(rssText)) !== null) {
      const itemContent = match[1];
      const title = this.extractFromXML(itemContent, 'title');
      const description = this.extractFromXML(itemContent, 'description');
      const link = this.extractFromXML(itemContent, 'link');
      
      if (title && description) {
        items.push({ title, description, link });
      }
    }
    
    return items.slice(0, 10); // Limit to 10 items
  }

  private extractFromXML(content: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 's');
    const match = content.match(regex);
    return match ? match[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim() : '';
  }

  private extractCompanyFromTitle(title: string): string {
    // Extract company name from job title
    const match = title.match(/:\s*(.+?)\s*\(/);
    return match ? match[1].trim() : 'Unknown Company';
  }

  private extractRequirements(description: string): string {
    // Extract requirements section from job description
    const reqKeywords = ['requirements', 'qualifications', 'must have', 'skills', 'experience'];
    const lines = description.split('\n');
    
    for (const keyword of reqKeywords) {
      const index = lines.findIndex(line => 
        line.toLowerCase().includes(keyword) && line.includes(':')
      );
      if (index !== -1) {
        return lines.slice(index, index + 5).join('\n');
      }
    }
    
    // Fallback: return first 200 characters
    return description.substring(0, 200) + '...';
  }

  private extractExperience(description: string): string {
    const expPatterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\s*to\s*(\d+)\s*years/i,
      /minimum\s*(\d+)\s*years/i,
      /at\s*least\s*(\d+)\s*years/i
    ];
    
    for (const pattern of expPatterns) {
      const match = description.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Check for experience levels
    const levels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    for (const level of levels) {
      if (description.toLowerCase().includes(level)) {
        return `${level.charAt(0).toUpperCase() + level.slice(1)} level`;
      }
    }
    
    return 'Not specified';
  }

  private extractSkills(description: string): string[] {
    // Common tech skills to look for
    const techSkills = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python',
      'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'html', 'css', 'sass', 'scss', 'sql', 'mongodb', 'postgresql', 'mysql',
      'redis', 'elasticsearch', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
      'jenkins', 'git', 'github', 'gitlab', 'jira', 'figma', 'sketch',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy'
    ];
    
    const foundSkills = [];
    const lowerDescription = description.toLowerCase();
    
    for (const skill of techSkills) {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }
    
    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  private async scrapeRemoteJobs(): Promise<ScrapedJob[]> {
    console.log('Starting real job scraping...');
    
    const allJobs: ScrapedJob[] = [];
    
    // Fetch from multiple sources concurrently
    const sources = [
      this.fetchFromRemoteOK(),
      this.fetchFromRemotelyJobs(),
      this.fetchFromWeworkRemotely()
    ];
    
    const results = await Promise.allSettled(sources);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allJobs.push(...result.value);
        console.log(`Source ${index + 1}: Found ${result.value.length} jobs`);
      } else {
        console.error(`Source ${index + 1} failed:`, result.reason);
      }
    });
    
    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => 
        j.title.toLowerCase() === job.title.toLowerCase() && 
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );
    
    console.log(`Total unique jobs found: ${uniqueJobs.length}`);
    return uniqueJobs;
  }


  private async analyzeJobMatch(job: ScrapedJob, userProfile: User): Promise<{
    matchScore: number;
    reasons: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `
        Analyze the job match between this user profile and job posting:

        User Profile:
        - Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
        - Experience: ${userProfile.experience || 'Not specified'}
        - Location: ${userProfile.location || 'Not specified'}
        - Education: ${userProfile.education || 'Not specified'}

        Job Posting:
        - Title: ${job.title}
        - Company: ${job.company}
        - Required Skills: ${job.skills.join(', ')}
        - Experience: ${job.experience}
        - Location: ${job.location}
        - Requirements: ${job.requirements}

        Provide a JSON response with:
        1. matchScore (0-100): How well the user matches this job
        2. reasons (array): Why this is a good/bad match
        3. recommendations (array): What the user should do to improve their application

        Focus on remote work compatibility, skill alignment, and experience level.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a job matching expert. Analyze job-candidate fit and provide actionable insights. Return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        matchScore: Math.min(100, Math.max(0, analysis.matchScore || 0)),
        reasons: Array.isArray(analysis.reasons) ? analysis.reasons : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
      };
    } catch (error) {
      console.error("Error analyzing job match:", error);
      return {
        matchScore: 50,
        reasons: ["Unable to analyze match - please review manually"],
        recommendations: ["Review job requirements and tailor your application"]
      };
    }
  }

  async searchAndAnalyzeRemoteJobs(userId: number): Promise<{
    jobs: (ScrapedJob & { matchScore: number; reasons: string[]; recommendations: string[] })[];
    totalFound: number;
    searchTimestamp: Date;
  }> {
    try {
      // Get user profile
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Scrape remote jobs from real sources
      const scrapedJobs = await this.scrapeRemoteJobs();

      // Analyze each job for match quality
      const analyzedJobs = await Promise.all(
        scrapedJobs.map(async (job) => {
          const analysis = await this.analyzeJobMatch(job, user);
          return {
            ...job,
            ...analysis
          };
        })
      );

      // Sort by match score (highest first)
      analyzedJobs.sort((a, b) => b.matchScore - a.matchScore);

      return {
        jobs: analyzedJobs,
        totalFound: analyzedJobs.length,
        searchTimestamp: new Date()
      };
    } catch (error) {
      console.error("Error in searchAndAnalyzeRemoteJobs:", error);
      throw error;
    }
  }

  async saveJobsToDatabase(jobs: ScrapedJob[]): Promise<void> {
    try {
      const jobsToInsert: InsertJob[] = jobs.map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        requirements: job.requirements,
        salary: job.salary,
        type: job.type,
        experience: job.experience,
        skills: job.skills,
        source: "AI Scraper",
        sourceUrl: job.sourceUrl,
        isActive: true,
        isRemote: job.isRemote
      }));

      // Check for existing jobs to avoid duplicates
      const existingJobs = await storage.getJobs();
      const existingUrls = new Set(existingJobs.map(job => job.sourceUrl));
      
      const newJobs = jobsToInsert.filter(job => !existingUrls.has(job.sourceUrl));
      
      if (newJobs.length > 0) {
        await Promise.all(newJobs.map(job => storage.createJob(job)));
        console.log(`Saved ${newJobs.length} new remote jobs to database`);
      }
    } catch (error) {
      console.error("Error saving jobs to database:", error);
    }
  }

  async autoSearchAndSave(userId: number): Promise<void> {
    try {
      const result = await this.searchAndAnalyzeRemoteJobs(userId);
      await this.saveJobsToDatabase(result.jobs);
      
      // Create notification for user about new jobs
      await storage.createNotification({
        userId,
        type: "job_alert",
        title: "New Remote Jobs Found",
        message: `Found ${result.totalFound} remote jobs matching your profile. Check them out!`,
        isRead: false
      });
    } catch (error) {
      console.error("Error in auto search and save:", error);
    }
  }
}

export const jobScraper = new JobScraper();