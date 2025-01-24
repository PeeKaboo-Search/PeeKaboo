import React, { useEffect, useState } from "react";

interface SummaryProps {
  query: string;
}

const Summary: React.FC<SummaryProps> = ({ query }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const context =
        "Explain to me this product in marketing language and terms. Give me a detailed market analysis.";
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

      if (!apiKey) {
        setError("API key is missing. Check your .env file.");
        return;
      }

      try {
        // Introduce a 5-second delay
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "mixtral-8x7b-32768",
              messages: [
                { role: "system", content: context },
                { role: "user", content: query },
              ],
              temperature: 0.7,
              max_tokens: 3000,
            }),
          }
        );

        const data = await response.json();

        if (data.choices && data.choices[0]) {
          setSummary(data.choices[0].message.content);
        } else {
          setError("Failed to retrieve a valid summary.");
        }
      } catch (err) {
        setError("An error occurred while fetching the summary.");
      }
    };

    fetchSummary();
  }, [query]);

  return (
    <div className="glass-card p-6">
      <h2 className="text-[1.75rem] font-semibold text-[var(--color-primary-blue)] mb-4">
        Summary
      </h2>
      {error ? (
        <p className="text-[var(--color-competitors-rose)] font-medium">{error}</p>
      ) : summary ? (
        <p className="text-[rgba(255,255,255,0.8)]">{summary}</p>
      ) : (
        <p className="text-[rgba(255,255,255,0.6)]">
          Generating your tailored marketing summary...
        </p>
      )}
    </div>
  );
};

export default Summary;
