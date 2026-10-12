import React from 'react';
import FormattedAIReport from './FormattedAIReport';

function AIOutput({ data, loading, error }) {
  if (loading) return <FormattedAIReport loading />;
  if (error) return <FormattedAIReport error={error} />;
  if (data === null || data === undefined) return null;

  let parsed = data;
  if (typeof data === 'string') {
    try { parsed = JSON.parse(data); } catch { /* Plain text remains readable. */ }
  }
  const content = parsed && typeof parsed === 'object'
    ? (parsed.data ?? parsed.result ?? parsed.response ?? parsed)
    : parsed;
  return <FormattedAIReport response={content} title="AI Analysis Results" model={parsed?.model} />;
}

export default AIOutput;
