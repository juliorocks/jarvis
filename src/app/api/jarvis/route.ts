import { NextResponse } from 'next/server';
import { model as geminiModel } from '@/lib/gemini';
import OpenAI from 'openai';

// Initialize OpenAI client if key is available
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(req: Request) {
    try {
        const { type, content, context } = await req.json(); // type: 'text' | 'image'

        console.log(`[Jarvis] Processing ${type} request...`);

        const systemPrompt = `
            You are a financial and personal assistant named Jarvis. 
            Analyze the user input and extract structured data to perform an action.
            
            Current Context: 
            Date: ${context?.currentDate || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            Timezone: ${context?.timezone || 'America/Sao_Paulo'}
            Family ID: ${context?.familyId || 'unknown'}

            Possible Actions:
            1. 'transaction': For expenses, incomes, transfers.
            2. 'event': For creating NEW calendar events.
            3. 'task': For to-do items.
            4. 'delete_event': For cancelling or removing existing events.
            5. 'update_event': For rescheduling or changing event details.

            Output JSON format only, no markdown:
            {
                "action": "transaction" | "event" | "task" | "delete_event" | "update_event",
                "confidence": number (0-1),
                "data": { ...specific fields... }
            }

            For 'transaction':
            fields: type ('income'|'expense'), amount (number), description (string), category (string guess), date (ISO string YYYY-MM-DD), payment_method (guess: 'credit_card'|'wallet'|'pix').
            
            For 'event' (Create):
            fields: title (string), start (ISO string with timezone offset, e.g. "2023-10-27T10:00:00-03:00"), end (ISO string with offset), allDay (boolean).
            IMPORTANT: Use the Timezone from context to calculate the correct ISO offset. Do not return UTC (Z) unless the user asks for UTC.
            
            For 'task':
            fields: title (string), due_date (ISO string).

            For 'delete_event':
            fields: original_reference (string: title or description to find the event), date (optional ISO string if specified, helps disambiguate).

            For 'update_event':
            fields: original_reference (string), new_title (optional), new_start (optional ISO), new_end (optional ISO).

            Logic Tips:
            - "cancelar", "excluir", "apagar" -> delete_event
            - "remarcar", "mudar", "alterar" -> update_event
            - "agendar", "marcar" -> event (create)
        `;

        let rawResponse = "";

        // STRATEGY 1: TRY OPENAI (Preferred if available)
        if (openai) {
            console.log("[Jarvis] Using OpenAI...");
            try {
                if (type === 'text') {
                    const completion = await openai.chat.completions.create({
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: content }
                        ],
                        model: "gpt-4o", // Or gpt-3.5-turbo if 4o is too expensive/not available
                        response_format: { type: "json_object" }
                    });
                    rawResponse = completion.choices[0].message.content || "";
                } else if (type === 'image') {
                    const completion = await openai.chat.completions.create({
                        messages: [
                            { role: "system", content: systemPrompt },
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Analyze this image for financial data or events." },
                                    { type: "image_url", image_url: { url: content } } // content is data:image/jpeg;base64,...
                                ]
                            }
                        ],
                        model: "gpt-4o",
                        response_format: { type: "json_object" }
                    });
                    rawResponse = completion.choices[0].message.content || "";
                }
            } catch (openaiError) {
                console.error("[Jarvis] OpenAI Error:", openaiError);
                // Fallback to Gemini handled below if rawResponse is empty
            }
        }

        // STRATEGY 2: TRY GEMINI (Fallback)
        if (!rawResponse) {
            console.log("[Jarvis] Using Gemini (Fallback)...");
            try {
                // Gemini doesn't support system prompts cleanly in the free tier SDK uniformly, so we prepend to user message
                const fullPrompt = `${systemPrompt}\n\nUser Input: "${type === 'text' ? content : 'See attached image'}"`;

                let result;
                if (type === 'text') {
                    result = await geminiModel.generateContent(fullPrompt);
                } else if (type === 'image') {
                    const cleanBase64 = content.split(',')[1] || content;
                    const imagePart = {
                        inlineData: {
                            data: cleanBase64,
                            mimeType: "image/jpeg"
                        },
                    };
                    result = await geminiModel.generateContent([fullPrompt, imagePart]);
                }
                const response = result?.response;
                rawResponse = response?.text() || "";
            } catch (geminiError) {
                console.error("[Jarvis] Gemini Error:", geminiError);
                return NextResponse.json({ error: "Failed to process with Artificial Intelligence." }, { status: 500 });
            }
        }

        console.log("--- Jarvis Raw Output ---");
        console.log(rawResponse);
        console.log("-------------------------");

        // Clean & Parse
        let cleanText = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstParen = cleanText.indexOf('{');
        const lastParen = cleanText.lastIndexOf('}');
        if (firstParen !== -1 && lastParen !== -1) {
            cleanText = cleanText.substring(firstParen, lastParen + 1);
        }

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error("Jarvis Internal Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
