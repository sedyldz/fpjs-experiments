export function parseCSVData(csvText: string) {
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

// Parse a CSV line, handling quoted fields properly
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}

export function transformCSVToEvents(csvData: any[]) {
  return csvData.map(row => ({
    visitorId: row.visitorId || '',
    ipAddress: row.ip || '',
    requestId: row.requestId || '',
    date: new Date(row.time || row.timestamp || ''),
    browser: row['browserDetails.browserName'] || '',
    os: row['browserDetails.os'] || '',
    country: row['ipLocation.country.name'] || '',
    city: row['ipLocation.city.name'] || '',
    confidence: parseFloat(row['confidence.score']) || 0,
    vpnDetected: row['vpn.result'] === 'true' || false, // Default to false if field doesn't exist
    botDetected: row['bot.result'] === 'detected' || false, // Default to false if field doesn't exist
    linkedId: row.linkedId || '',
    url: row.url || '',
    userAgent: row.userAgent || '',
    suspectScore: parseFloat(row['suspectScore.result']) || 0 // Default to 0 if field doesn't exist
  }));
}



