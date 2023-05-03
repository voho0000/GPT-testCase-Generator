import dotenv from "dotenv";

dotenv.config();


export function getApiKey(): string {
    const apiKey = process.env.ASANA_API_KEY;
  
    if (!apiKey) {
      throw new Error("ASANA_API_KEY environment variable is not set.");
    }
  
    return apiKey;
  }
  