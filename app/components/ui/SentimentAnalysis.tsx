import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

interface SentimentAnalysisProps {
  query: string;
}

interface GraphData {
  labels: string[];
  values: number[];
}

interface ApiResponse {
  summary: string;
  graphData: GraphData;
  sentimentDistribution: { [key: string]: number };
}

const fetchSentimentData = async (query: string): Promise<ApiResponse> => {
  const apiUrl = process.env.lNEXT_PUBLIC_GROQ_API_URL;
  const apiKey = process.env.lNEXT_PUBLIC_GROQ_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("API URL or API Key is missing in the environment variables.");
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sentiment data: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/json")) {
      throw new Error("Invalid response: Expected JSON, but received something else.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sentiment data:", error);
    throw new Error("An error occurred while fetching sentiment data.");
  }
};

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ query }) => {
  const [summary, setSummary] = useState<string>("");
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [sentimentDistribution, setSentimentDistribution] = useState<{ [key: string]: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchSentimentData(query);
        setSummary(data.summary);
        setGraphData(data.graphData);
        setSentimentDistribution(data.sentimentDistribution);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchData();
  }, [query]);

  const rainbowColors = ["#FF5F5F", "#FF8C5F", "#FFC65F", "#A3FF5F", "#5FFFF5", "#5FA3FF", "#9C5FFF"];

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Sentiment Analysis</h2>

      {error ? (
        <div className="text-red-500">
          <p>Error: {error}</p>
          <p>Please check the API URL, key, or network connection.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 mb-6">Summary for query: "{query}"</p>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Summary</h3>
            <p className="text-gray-600">{summary || "Loading..."}</p>
          </div>

          {graphData && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Trends Over Time</h3>
              <Line
                data={{
                  labels: graphData.labels,
                  datasets: [
                    {
                      label: "Sentiment Score",
                      data: graphData.values,
                      borderColor: rainbowColors,
                      borderWidth: 2,
                      fill: true,
                      backgroundColor: "rgba(255, 99, 132, 0.2)",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                }}
              />
            </div>
          )}

          {sentimentDistribution && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Sentiment Distribution</h3>
              <Doughnut
                data={{
                  labels: Object.keys(sentimentDistribution),
                  datasets: [
                    {
                      data: Object.values(sentimentDistribution),
                      backgroundColor: rainbowColors,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SentimentAnalysis;
