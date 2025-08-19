export function parseCSVData(csvText: string) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
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
    vpnDetected: row['vpn.result'] === 'true',
    botDetected: row['bot.result'] === 'detected',
    linkedId: row.linkedId || '',
    url: row.url || '',
    userAgent: row.userAgent || ''
  }));
}



