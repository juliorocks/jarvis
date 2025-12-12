"use server";

import { model } from "@/lib/gemini";

export async function generateFinanceInsights(metrics: any) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                expensesAnalysis: "Configure a chave de API do Gemini para ver análises.",
                incomeAnalysis: "Configure a chave de API do Gemini para ver análises.",
                overallAnalysis: "Configure a chave de API do Gemini para ver análises."
            };
        }

        const prompt = `
      Atue como um analista financeiro pessoal (Jarvis).
      Analise os seguintes dados financeiros do mês atual:
      ${JSON.stringify(metrics)}
      
      Forneça:
      1. Uma breve análise das Despesas (foco em categorias altas ou aumento). Max 15 palavras.
      2. Uma breve análise das Receitas. Max 15 palavras.
      3. Um resumo geral do mês e uma dica rápida. Max 30 palavras.
      
      Responda estritamente em formato JSON:
      {
        "expensesAnalysis": "...",
        "incomeAnalysis": "...",
        "overallAnalysis": "..."
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean code fence if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanText);
        } catch (e) {
            return {
                expensesAnalysis: cleanText, // Fallback if not JSON
                incomeAnalysis: "",
                overallAnalysis: ""
            };
        }

    } catch (error) {
        console.error("AI Error:", error);
        return {
            expensesAnalysis: "Não foi possível gerar análise.",
            incomeAnalysis: "Não foi possível gerar análise.",
            overallAnalysis: "Erro ao consultar o Oráculo."
        };
    }
}
