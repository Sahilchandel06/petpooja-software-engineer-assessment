import { useEffect, useState } from 'react';
import { http } from '../api/http.js';

export function HealthStatus() {
  const [status, setStatus] = useState('Checking API…');

  useEffect(() => {
    let active = true;

    http.get('/health')
      .then(({ data }) => {
        if (active) setStatus(`API status: ${data.status}`);
      })
      .catch(() => {
        if (active) setStatus('API unavailable. Start the server and check its configuration.');
      });

    return () => {
      active = false;
    };
  }, []);

  return <p role="status" className="mt-4 text-sm text-slate-600 dark:text-slate-300">{status}</p>;
}
