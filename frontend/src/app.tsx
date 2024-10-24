import React, { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
    }
  };

  const handleFileRead = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsedUrls = content.split('\n').map(line => line.trim()).filter(Boolean);
        setUrls(parsedUrls);
      };
      reader.readAsText(file);
    }
  };

  const calculateMetrics = async () => {
    if (urls.length > 0) {
      try {
        const response = await fetch('/api/calculate-metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ urls }),
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Error calculating metrics:", error);
      }
    }
  };

  return (
    <div>
      <h1>Upload URL File</h1>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleFileRead}>Read File</button>

      {urls.length > 0 && (
        <div>
          <h2>URLs:</h2>
          <ul>
            {urls.map((url, index) => (
              <li key={index}>{url}</li>
            ))}
          </ul>
          <button onClick={calculateMetrics}>Calculate Metrics</button>
        </div>
      )}

      {results && (
        <div>
          <h2>Metrics Results:</h2>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
