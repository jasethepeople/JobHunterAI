import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateResume(jobDescription: string, userProfile: any): Promise<string> {
  try {
    const prompt = `
    Generate a professional resume tailored for this job description. 
    
    Job Description: ${jobDescription}
    
    User Profile:
    - Name: ${userProfile.firstName} ${userProfile.lastName}
    - Email: ${userProfile.email}
    - Location: ${userProfile.location}
    - Skills: ${userProfile.skills?.join(', ') || 'N/A'}
    - Experience: ${userProfile.experience || 'N/A'}
    - Education: ${userProfile.education || 'N/A'}
    
    Create a professional, ATS-friendly resume that highlights relevant experience and skills for this specific job. Format it as plain text with clear sections.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    return response.choices[0].message.content || "Unable to generate resume";
  } catch (error) {
    console.error("Error generating resume:", error);
    throw new Error("Failed to generate resume");
  }
}

export async function generateCoverLetter(
  jobDescription: string, 
  companyName: string, 
  jobTitle: string, 
  userProfile: any
): Promise<string> {
  try {
    const prompt = `
    Generate a professional cover letter for this job application.
    
    Job Title: ${jobTitle}
    Company: ${companyName}
    Job Description: ${jobDescription}
    
    User Profile:
    - Name: ${userProfile.firstName} ${userProfile.lastName}
    - Experience: ${userProfile.experience || 'N/A'}
    - Skills: ${userProfile.skills?.join(', ') || 'N/A'}
    
    Create a compelling, personalized cover letter that demonstrates enthusiasm for the role and company. Keep it professional and concise (3-4 paragraphs).
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Unable to generate cover letter";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter");
  }
}

export async function analyzeJobRequirements(jobDescription: string): Promise<{
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}> {
  try {
    const prompt = `
    Analyze this job description and extract key requirements. Return the response in JSON format.
    
    Job Description: ${jobDescription}
    
    Extract and return:
    {
      "skills": ["array of required skills"],
      "experience": "required experience level",
      "education": "education requirements",
      "summary": "brief summary of the role"
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    return {
      skills: analysis.skills || [],
      experience: analysis.experience || "",
      education: analysis.education || "",
      summary: analysis.summary || ""
    };
  } catch (error) {
    console.error("Error analyzing job requirements:", error);
    throw new Error("Failed to analyze job requirements");
  }
}
