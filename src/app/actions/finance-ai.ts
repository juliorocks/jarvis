"use server";

import { openai } from "@/lib/openai";

export async function generateFinanceInsights(metrics: any) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                expensesAnalysis: "Configure a chave de API da OpenAI para ver análises.",
                incomeAnalysis: "Configure a chave de API da OpenAI para ver análises.",
                overallAnalysis: "Configure a chave de API da OpenAI para ver análises."
            };
        }

        const prompt = `
      Atue como um analista financeiro pessoal (Jarvis).
      Analise os seguintes dados financeiros do mês atual:
      ${JSON.stringify(metrics)}
      
      Forneça:
      1. Uma breve análise das Despesas (foco em categorias altas ou aumento). Max 20 palavras.
      2. Uma breve análise das Receitas. Max 20 palavras.
      3. Um resumo geral do mês e uma dica rápida. Max 40 palavras.
      
      Responda estritamente em formato JSON:
      {
        "expensesAnalysis": "...",
        "incomeAnalysis": "...",
        "overallAnalysis": "..."
      }
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const text = response.choices[0].message.content;
        if (!text) throw new Error("No response from OpenAI");

        return JSON.parse(text);

    } catch (error) {
        console.error("AI Error:", error);
        return {
            expensesAnalysis: "Não foi possível gerar análise.",
            incomeAnalysis: "Não foi possível gerar análise.",
            overallAnalysis: "Erro ao consultar o Oráculo."
        };
    }
}

export async function generateCalendarInsights(events: any[]) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                dailyAnalysis: "Configure a chave de API da OpenAI.",
                weeklyAnalysis: "Configure a chave de API da OpenAI."
            };
        }

        const prompt = `
      Atue como um assistente pessoal (Jarvis).
      Analise os seguintes eventos do calendário (foco na próxima semana):
      ${JSON.stringify(events.slice(0, 20))}
      
      Forneça:
      1. Um resumo do dia de hoje e o que esperar. Max 20 palavras.
      2. Uma visão geral da semana (semana cheia/tranquila, principais focos). Max 30 palavras.
      
      Responda estritamente em formato JSON:
      {
        "dailyAnalysis": "...",
        "weeklyAnalysis": "..."
      }
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
        });

        const text = response.choices[0].message.content;
        if (!text) throw new Error("No response from OpenAI");

        return JSON.parse(text);

    } catch (error) {
        console.error("AI Calendar Error:", error);
        return {
            dailyAnalysis: "Não foi possível analisar a agenda.",
            weeklyAnalysis: "Não foi possível analisar a agenda."
        };
    }
}
