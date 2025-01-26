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
import { Loader2 } from 'lucide-react';
import { fetchMarketAnalysisData, MarketAnalysisAPIError } from '@/app/api/trendAnalysis';

// Soft, light color palette
const lightChartColors = {
  line: [
    {
      border: 'rgba(102, 204, 255, 1)',     // Pastel Sky Blue
      background: 'rgba(102, 204, 255, 0.2)'
    },
    {
      border: 'rgba(255, 179, 71, 1)',      // Soft Peach
      background: 'rgba(255, 179, 71, 0.2)'
    },
    {
      border: 'rgba(95, 209, 169, 1)',      // Mint Green
      background: 'rgba(95, 209, 169, 0.2)'
    }
  ],
  bar: [
    'rgba(102, 204, 255, 0.6)',    // Pastel Sky Blue
    'rgba(255, 179, 71, 0.6)',     // Soft Peach
    'rgba(95, 209, 169, 0.6)',     // Mint Green
    'rgba(178, 136, 254, 0.6)',    // Lavender
    'rgba(255, 137, 167, 0.6)'     // Soft Pink
  ],
  pie: [
    'rgba(102, 204, 255, 0.7)',    // Pastel Sky Blue
    'rgba(255, 179, 71, 0.7)',     // Soft Peach
    'rgba(95, 209, 169, 0.7)',     // Mint Green
    'rgba(178, 136, 254, 0.7)',    // Lavender
    'rgba(255, 137, 167, 0.7)'     // Soft Pink
  ]
};

// Glassmorphism style with slight modifications
const glassMorphismStyle = {
  background: 'rgba(22, 22, 28, 0.5)',
  backdropFilter: 'blur(30px)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '20px',
  boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
  padding: '1.5rem',
  position: 'relative' as const,
  zIndex: 2
};

// Define types for the analysis data
interface AnalysisDataset {
  label: string;
  data: number[];
}

interface AnalysisSection {
  title: string;
  labels: string[];
  data?: number[];
  datasets?: AnalysisDataset[];
}

interface MarketAnalysisData {
  historicTrend: AnalysisSection;
  marketShare: AnalysisSection;
  sentiment: AnalysisSection;
  regional: AnalysisSection;
  demographics: AnalysisSection;
  priceDistribution: AnalysisSection;
}

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

// Custom chart options with subtle styling
const getChartOptions = (title: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.8)'
    },
    line: {
      borderWidth: 2,
      tension: 0.4  // Soft curve
    }
  },
  plugins: {
    title: { 
      display: true, 
      text: title,
      color: 'rgba(255,255,255,0.9)',
      font: {
        size: 16,
        weight: 'bold' as const
      }
    },
    legend: { 
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(255,255,255,0.9)',
      titleColor: 'rgba(0,0,0,0.8)',
      bodyColor: 'rgba(0,0,0,0.7)'
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        color: 'rgba(255,255,255,0.1)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(255,255,255,0.6)',
        font: {
          size: 10
        }
      }
    },
    y: {
      display: true,
      grid: {
        color: 'rgba(255,255,255,0.1)',
        drawBorder: false
      },
      ticks: {
        color: 'rgba(255,255,255,0.6)',
        font: {
          size: 10
        }
      }
    }
  }
});

interface TrendAnalysisProps {
  query: string;
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ query }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<MarketAnalysisData | null>(null);

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
      <div 
        style={{
          ...glassMorphismStyle,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}
      >
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{
          ...glassMorphismStyle,
          color: 'rgba(255,0,0,0.7)'
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  if (!analysisData) {
    return null;
  }

  return (
    <div 
      style={{
        ...glassMorphismStyle,
        width: '100%',
        color: 'white'
      }}
    >
      <h3 className="text-2xl font-bold mb-6 text-white">Market Analysis Dashboard</h3>
      
      <div className="space-y-8">
        {/* Historic Trend Chart */}
        <div 
          style={{
            ...glassMorphismStyle,
            height: '24rem',
            marginBottom: '1.5rem'
          }}
        >
          <Line
            data={{
              labels: analysisData.historicTrend.labels,
              datasets: analysisData.historicTrend.datasets?.map((dataset, index) => ({
                ...dataset,
                borderColor: lightChartColors.line[index % lightChartColors.line.length].border,
                backgroundColor: lightChartColors.line[index % lightChartColors.line.length].background,
                borderWidth: 2
              })) || []
            }}
            options={getChartOptions(analysisData.historicTrend.title)}
          />
        </div>

        {/* Market Share and Sentiment Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div 
            style={{
              ...glassMorphismStyle,
              height: '20rem'
            }}
          >
            <Pie
              data={{
                labels: analysisData.marketShare.labels,
                datasets: [{
                  data: analysisData.marketShare.data || [],
                  backgroundColor: lightChartColors.pie,
                  borderWidth: 0
                }]
              }}
              options={{
                ...getChartOptions(analysisData.marketShare.title),
                plugins: {
                  ...getChartOptions(analysisData.marketShare.title).plugins,
                  legend: { 
                    display: true,
                    position: 'right',
                    labels: {
                      color: 'rgba(255,255,255,0.8)'
                    }
                  }
                }
              }}
            />
          </div>
          <div 
            style={{
              ...glassMorphismStyle,
              height: '20rem'
            }}
          >
            <Doughnut
              data={{
                labels: analysisData.sentiment.labels,
                datasets: [{
                  data: analysisData.sentiment.data || [],
                  backgroundColor: lightChartColors.pie.slice(0, 3),
                  borderWidth: 0
                }]
              }}
              options={{
                ...getChartOptions(analysisData.sentiment.title),
                plugins: {
                  ...getChartOptions(analysisData.sentiment.title).plugins,
                  legend: { 
                    display: true,
                    position: 'right',
                    labels: {
                      color: 'rgba(255,255,255,0.8)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Regional Distribution Chart */}
        <div 
          style={{
            ...glassMorphismStyle,
            height: '20rem'
          }}
        >
          <Bar
            data={{
              labels: analysisData.regional.labels,
              datasets: [{
                label: 'Regional Distribution',
                data: analysisData.regional.data || [],
                backgroundColor: lightChartColors.bar,
                borderWidth: 0
              }]
            }}
            options={getChartOptions(analysisData.regional.title)}
          />
        </div>

        {/* Demographics Chart */}
        <div 
          style={{
            ...glassMorphismStyle,
            height: '20rem'
          }}
        >
          <Bar
            data={{
              labels: analysisData.demographics.labels,
              datasets: [{
                label: 'Age Distribution',
                data: analysisData.demographics.data || [],
                backgroundColor: lightChartColors.bar,
                borderWidth: 0
              }]
            }}
            options={getChartOptions(analysisData.demographics.title)}
          />
        </div>

        {/* Price Distribution Chart */}
        <div 
          style={{
            ...glassMorphismStyle,
            height: '20rem'
          }}
        >
          <Bar
            data={{
              labels: analysisData.priceDistribution.labels,
              datasets: [{
                label: 'Price Distribution',
                data: analysisData.priceDistribution.data || [],
                backgroundColor: lightChartColors.bar,
                borderWidth: 0
              }]
            }}
            options={getChartOptions(analysisData.priceDistribution.title)}
          />
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;