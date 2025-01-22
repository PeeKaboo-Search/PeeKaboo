import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { fetchMarketAnalysisData, chartColors, MarketAnalysisAPIError } from '@/app/api/trendAnalysis';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface TrendAnalysisProps {
  query: string;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ query }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMarketAnalysisData(query);
        setAnalysisData(data);
      } catch (err) {
        setError(err instanceof MarketAnalysisAPIError ? err.message : 'Failed to load analysis data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [query]);

  if (loading) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-60 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-40 bg-gray-200 rounded"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-500 flex items-center justify-center">
          <span className="mr-2">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-6">Market Analysis Dashboard</h3>
      
      <div className="space-y-6">
        {/* Historic Trend Chart */}
        <div className="h-96">
          <Line
            data={{
              labels: analysisData.historicTrend.labels,
              datasets: analysisData.historicTrend.datasets.map((dataset: any) => ({
                ...dataset,
                borderColor: chartColors.line,
                tension: 0.1
              }))
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: analysisData.historicTrend.title }
              }
            }}
          />
        </div>

        {/* Market Share and Sentiment Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64">
            <Pie
              data={{
                labels: analysisData.marketShare.labels,
                datasets: [{
                  data: analysisData.marketShare.data,
                  backgroundColor: chartColors.pie
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: { display: true, text: analysisData.marketShare.title },
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
          <div className="h-64">
            <Doughnut
              data={{
                labels: analysisData.sentiment.labels,
                datasets: [{
                  data: analysisData.sentiment.data,
                  backgroundColor: chartColors.pie.slice(0, 3)
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: { display: true, text: analysisData.sentiment.title },
                  legend: { position: 'right' }
                }
              }}
            />
          </div>
        </div>

        {/* Regional Distribution Chart */}
        <div className="h-64">
          <Bar
            data={{
              labels: analysisData.regional.labels,
              datasets: [{
                label: 'Regional Distribution',
                data: analysisData.regional.data,
                backgroundColor: chartColors.bar
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: analysisData.regional.title }
              }
            }}
          />
        </div>

        {/* Demographics Chart */}
        <div className="h-64">
          <Bar
            data={{
              labels: analysisData.demographics.labels,
              datasets: [{
                label: 'Age Distribution',
                data: analysisData.demographics.data,
                backgroundColor: chartColors.bar
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: analysisData.demographics.title }
              }
            }}
          />
        </div>

        {/* Price Distribution Chart */}
        <div className="h-64">
          <Bar
            data={{
              labels: analysisData.priceDistribution.labels,
              datasets: [{
                label: 'Price Distribution',
                data: analysisData.priceDistribution.data,
                backgroundColor: chartColors.bar
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: { display: true, text: analysisData.priceDistribution.title }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;