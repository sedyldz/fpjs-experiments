import { Button } from './ui/button';
import { 
  Filter,
  Calendar,
  Download,
  Copy,
} from 'lucide-react';

interface FingerprintEvent {
  visitorId: string;
  ipAddress: string;
  requestId: string;
  date: Date;
  browser: string;
  os: string;
  country: string;
  city: string;
  confidence: number;
  vpnDetected: boolean;
  botDetected: boolean;
  linkedId: string;
  url: string;
  userAgent: string;
  suspectScore: number;
}

interface IdentificationProps {
  events: FingerprintEvent[];
  onOpenChat: () => void;
}

export function Identification({ events, onOpenChat }: IdentificationProps) {
  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'United States': '🇺🇸',
      'Germany': '🇩🇪',
      'Sweden': '🇸🇪',
      'Turkey': '🇹🇷',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'France': '🇫🇷',
      'Netherlands': '🇳🇱',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
    };
    return flagMap[country] || '🌍';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Identification events</h1>
        <p className="text-sm text-gray-500">
          Select a row for details. Events data is also available by{' '}
          <a href="#" className="text-blue-600 hover:text-blue-800 underline">server API</a>.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={onOpenChat}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.76.21 3.92 0C20.16 27 24 22.55 24 17V7l-10-5z"/>
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
            </svg>
            Analyze with AI
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </Button>
        </div>
      </div>

      {/* Event Count */}
      <div className="text-sm text-gray-700 mb-4">
        {events.length} events matching
      </div>

      {/* Events Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                VISITOR ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                IP ADDRESS
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                REQUEST ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                DATE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.slice(0, 11).map((event, index) => (
              <tr 
                key={`${event.requestId}-${index}`} 
                className="hover:bg-gray-50 cursor-pointer bg-white"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {event.visitorId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="mr-2">{getCountryFlag(event.country)}</span>
                    {event.ipAddress}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {event.requestId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  })}{' '}
                  {new Date(event.date).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
