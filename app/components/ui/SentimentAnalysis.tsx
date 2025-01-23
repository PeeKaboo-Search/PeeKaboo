import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/app/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Smile, 
  Frown, 
  Meh,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface SentimentAnalysisProps {
  query: string;
}

interface SentimentData {
  overall: {
    sentiment: string;
    score: number;
  };
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  details: string;
}

const DEFAULT_SENTIMENT_DATA: SentimentData = {
  overall: {
    sentiment: "Neutral",
    score: 0.5
  },
  emotions: {
    joy: 0,
    anger: 0,
    sadness: 0,
    fear: 0,
    surprise: 0
  },
  details: "No detailed analysis available."
};

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ query }) => {
  const [sentimentData, setSentimentData] = useState<SentimentData>(DEFAULT_SENTIMENT_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSentimentAnalysis = async () => {
      const context = "Perform a comprehensive sentiment analysis with detailed emotional breakdown. Return data in a structured format including overall sentiment, specific emotion scores, and detailed analysis.";
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

      if (!apiKey) {
        setError("API key is missing. Check your .env file.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
          const mockSentimentData: SentimentData = {
            overall: {
              sentiment: "Positive",
              score: 0.75
            },
            emotions: {
              joy: 0.6,
              anger: 0.2,
              sadness: 0.1,
              fear: 0.1,
              surprise: 0.3
            },
            details: data.choices[0].message.content
          };

          setSentimentData(mockSentimentData);
        } else {
          setError("Failed to retrieve sentiment analysis.");
          setSentimentData(DEFAULT_SENTIMENT_DATA);
        }
      } catch (err) {
        setError("An error occurred while fetching sentiment analysis.");
        setSentimentData(DEFAULT_SENTIMENT_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentAnalysis();
  }, [query]);

  // Bar Chart Data for Overall Sentiment
  const barChartData = [
    { name: 'Positive', value: sentimentData.overall.score * 100 },
    { name: 'Negative', value: (1 - sentimentData.overall.score) * 100 }
  ];

  // Emotions Radar Chart Data
  const radarChartData = Object.entries(sentimentData.emotions).map(([name, value]) => ({
    emotion: name.charAt(0).toUpperCase() + name.slice(1),
    score: value * 100
  }));

  // Emotion Icons
  const EmotionIcons = {
    joy: Smile,
    anger: Frown,
    sadness: Meh,
    fear: Frown,
    surprise: TrendingUp
  };

  if (isLoading) {
    return (
      <div className="w-full animate-pulse text-gray-400 text-center py-10">
        Analyzing sentiment...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-red-500 text-center py-10">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Highlights */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(sentimentData.emotions).map(([emotion, score]) => {
          const EmotionIcon = EmotionIcons[emotion as keyof typeof EmotionIcons];
          const isPositive = score > 0.5;

          return (
            <div 
              key={emotion} 
              className={`
                border rounded-lg p-4 
                ${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <EmotionIcon 
                    className={`
                      ${isPositive ? 'text-green-600' : 'text-red-600'}
                      w-6 h-6
                    `} 
                  />
                  <span className="font-semibold capitalize">
                    {emotion}
                  </span>
                </div>
                <div className="flex items-center">
                  {isPositive ? <ArrowUp className="text-green-600 mr-1" /> : <ArrowDown className="text-red-600 mr-1" />}
                  <span className="font-bold">
                    {(score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart for Overall Sentiment */}
        <div>
          <h4 className="text-md font-semibold mb-4">Sentiment Distribution</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="value" 
                fill={barChartData[0].name === 'Positive' ? '#4caf50' : '#f44336'}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart for Emotional Breakdown */}
        <div>
          <h4 className="text-md font-semibold mb-4">Emotional Spectrum</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart outerRadius={90} data={radarChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="emotion" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar 
                name="Emotions" 
                dataKey="score" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6} 
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-md font-semibold mb-2">Detailed Analysis</h3>
        <p className="text-gray-700">{sentimentData.details}</p>
      </div>
    </div>
  );
};

export default SentimentAnalysis;