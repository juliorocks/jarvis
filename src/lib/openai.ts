import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OPENAI_API_KEY is not defined in environment variables. AI features will not work.");
}

export const openai = new OpenAI({
    apiKey: apiKey || "",
    dangerouslyAllowBrowser: true // Ideally only use on server, but if reused in client components (not recommended) this might be needed. However, we are using server actions so this is fine.
});
