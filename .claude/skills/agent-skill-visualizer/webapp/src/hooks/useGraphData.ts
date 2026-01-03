import { useState, useEffect } from 'react';
import type { GraphData } from '../types/graph';

interface UseGraphDataResult {
  data: GraphData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useGraphData(dataUrl: string = './data/graph-data.json'): UseGraphDataResult {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(dataUrl);

      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      const jsonData: GraphData = await response.json();

      // Validate data structure
      if (!jsonData.nodes || !jsonData.edges || !jsonData.metadata) {
        throw new Error('Invalid graph data structure');
      }

      setData(jsonData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error loading graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataUrl]);

  return {
    data,
    loading,
    error,
    reload: fetchData
  };
}
