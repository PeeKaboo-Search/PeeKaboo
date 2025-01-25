import React, { useEffect, useState } from "react";

interface SummaryProps {
  query: string;
}

const Summary: React.FC<SummaryProps> = ({ query }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const context =
        "Explain to me this product in marketing language and terms. Give me a detailed market analysis.";
      const apiKey = process.env.NEXT_PUBLIC_SGROQ_API_KEY;

      // Reset state for new query
      setSummary(null);
      setError(null);
      setIsLoading(true);

      if (!apiKey) {
        setError("API key is missing. Check your .env file.");
        setIsLoading(false);
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0]) {
          setSummary(data.choices[0].message.content);
        } else {
          setError("Failed to retrieve a valid summary.");
        }
      } catch (error) {
        // Properly use the error parameter
        setError(error instanceof Error ? error.message : "An error occurred while fetching the summary.");
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchSummary();
    }
  }, [query]);

  return (
    <div className="glass-card p-6">
      <h2 className="text-[1.75rem] font-semibold text-[var(--color-primary-blue)] mb-4">
        Summary
      </h2>
      {error ? (
        <p className="text-[var(--color-competitors-rose)] font-medium">{error}</p>
      ) : isLoading ? (
        <p className="text-[rgba(255,255,255,0.6)]">
          Generating your tailored marketing summary...
        </p>
      ) : summary ? (
        <p className="text-[rgba(255,255,255,0.8)]">{summary}</p>
      ) : null}
    </div>
  );
};

export default Summary;