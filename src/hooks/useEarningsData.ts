
import { useState, useEffect } from 'react';
import { finnhubAPI, fmpAPI, openaiAPI } from '@/services/api';

export interface EarningsEvent {
  symbol: string;
  date: string;
  epsActual?: number;
  epsEstimate?: number;
  revenueActual?: number;
  revenueEstimate?: number;
  hour: string;
}

export interface EarningsTranscript {
  symbol: string;
  year: number;
  quarter: number;
  transcript: string;
  highlights?: string[];
}

export const useEarningsData = () => {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [transcripts, setTranscripts] = useState<EarningsTranscript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEarningsCalendar = async (from?: string, to?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Default to current week if no dates provided
      const fromDate = from || new Date().toISOString().split('T')[0];
      const toDate = to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log(`Fetching earnings calendar from ${fromDate} to ${toDate}`);
      
      const data = await finnhubAPI.getEarningsCalendar(fromDate, toDate);
      
      if (data?.earningsCalendar) {
        const processedEarnings = data.earningsCalendar.map((event: any) => ({
          symbol: event.symbol,
          date: event.date,
          epsActual: event.epsActual,
          epsEstimate: event.epsEstimate,
          revenueActual: event.revenueActual,
          revenueEstimate: event.revenueEstimate,
          hour: event.hour || 'amc' // after market close
        }));
        
        setEarnings(processedEarnings);
      } else {
        setEarnings([]);
      }
    } catch (err) {
      console.error('Error fetching earnings calendar:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings calendar');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsTranscript = async (symbol: string, year?: number, quarter?: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching earnings transcript for ${symbol} ${year}Q${quarter}`);
      
      const transcriptData = await fmpAPI.getEarningsTranscript(symbol, year || new Date().getFullYear(), quarter || Math.ceil((new Date().getMonth() + 1) / 3));
      
      if (transcriptData && transcriptData.length > 0 && transcriptData[0]?.content) {
        // Generate highlights using OpenAI
        const highlightsData = await openaiAPI.analyzeEarningsHighlights(symbol, transcriptData[0].content);
        
        const transcript: EarningsTranscript = {
          symbol,
          year: year || new Date().getFullYear(),
          quarter: quarter || Math.ceil((new Date().getMonth() + 1) / 3),
          transcript: transcriptData[0].content,
          highlights: highlightsData?.analysis ? highlightsData.analysis.split('\n').filter((line: string) => line.trim()) : []
        };
        
        setTranscripts(prev => {
          const filtered = prev.filter(t => !(t.symbol === symbol && t.year === year && t.quarter === quarter));
          return [transcript, ...filtered];
        });
        
        return transcript;
      } else {
        throw new Error('No transcript data found for this company and quarter');
      }
    } catch (err) {
      console.error('Error fetching earnings transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings transcript');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTranscripts = (symbol: string) => {
    return transcripts.filter(t => t.symbol === symbol);
  };

  useEffect(() => {
    // Fetch current week's earnings on mount
    fetchEarningsCalendar();
  }, []);

  return {
    earnings,
    transcripts,
    loading,
    error,
    fetchEarningsCalendar,
    fetchEarningsTranscript,
    getAvailableTranscripts,
    refetch: fetchEarningsCalendar
  };
};
