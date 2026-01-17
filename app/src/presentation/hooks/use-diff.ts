import { useCallback, useState } from 'react';
import { gitDiffApi } from '@/infrastructure/api';
import type { FileDiff } from '@/domain/entities';

export function useDiff() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileDiff = useCallback(async (path: string, staged = false): Promise<FileDiff> => {
    setLoading(true);
    setError(null);
    try {
      const diff = await gitDiffApi.getFileDiff(path, staged);
      return diff;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCommitDiff = useCallback(async (sha: string): Promise<FileDiff[]> => {
    setLoading(true);
    setError(null);
    try {
      const diffs = await gitDiffApi.getCommitDiff(sha);
      return diffs;
    } catch (err) {
      setError(String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getFileDiff,
    getCommitDiff,
  };
}
