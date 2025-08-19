import  { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowUpDown, Search,  Download, Link, Globe, Shield, Monitor, Clock } from 'lucide-react';

interface CSVEvent {
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
}

interface AnalyticsTableProps {
  csvData: CSVEvent[];
  onOpenAIChat: () => void;
}

export function AnalyticsTable({ csvData, onOpenAIChat }: AnalyticsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'visitorId' | 'ipAddress' | 'country' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [securityFilter, setSecurityFilter] = useState<string>('all');

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = csvData.filter(event => {
      const matchesSearch = event.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.ipAddress.includes(searchTerm) ||
                          event.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const eventDate = event.date.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        if (dateFilter === 'today') {
          matchesDate = eventDate === today;
        } else if (dateFilter === 'yesterday') {
          matchesDate = eventDate === yesterday;
        }
      }

      let matchesSecurity = true;
      if (securityFilter === 'vpn') {
        matchesSecurity = event.vpnDetected;
      } else if (securityFilter === 'bot') {
        matchesSecurity = event.botDetected;
      } else if (securityFilter === 'clean') {
        matchesSecurity = !event.vpnDetected && !event.botDetected;
      }
      
      return matchesSearch && matchesDate && matchesSecurity;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = a.date.getTime() - b.date.getTime();
      } else if (sortBy === 'visitorId') {
        comparison = a.visitorId.localeCompare(b.visitorId);
      } else if (sortBy === 'ipAddress') {
        comparison = a.ipAddress.localeCompare(b.ipAddress);
      } else if (sortBy === 'country') {
        comparison = a.country.localeCompare(b.country);
      } else if (sortBy === 'confidence') {
        comparison = a.confidence - b.confidence;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [csvData, searchTerm, dateFilter, securityFilter, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const stats = useMemo(() => {
    const total = filteredAndSortedEvents.length;
    const uniqueVisitors = new Set(filteredAndSortedEvents.map(e => e.visitorId)).size;
    const uniqueIPs = new Set(filteredAndSortedEvents.map(e => e.ipAddress)).size;
    const uniqueCountries = new Set(filteredAndSortedEvents.map(e => e.country).filter(Boolean)).size;
    const vpnDetected = filteredAndSortedEvents.filter(e => e.vpnDetected).length;
    const botDetected = filteredAndSortedEvents.filter(e => e.botDetected).length;
    const avgConfidence = filteredAndSortedEvents.reduce((sum, e) => sum + e.confidence, 0) / total || 0;
    
    return { total, uniqueVisitors, uniqueIPs, uniqueCountries, vpnDetected, botDetected, avgConfidence };
  }, [filteredAndSortedEvents]);

  const getSecurityBadge = (event: CSVEvent) => {
    if (event.vpnDetected) {
      return <Badge variant="destructive" className="text-xs">VPN</Badge>;
    }
    if (event.botDetected) {
      return <Badge variant="destructive" className="text-xs">Bot</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Clean</Badge>;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold">{stats.uniqueVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Threats</p>
                <p className="text-2xl font-bold">{stats.vpnDetected + stats.botDetected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">{(stats.avgConfidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>FingerprintJS Events</CardTitle>
              <CardDescription>
                Real-time identification events with security analysis. Select a row for details.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={onOpenAIChat}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10 9 11 1.16.21 2.76.21 3.92 0C20.16 27 24 22.55 24 17V7l-10-5z"/>
                  <path d="M8 12h8"/>
                  <path d="M12 8v8"/>
                </svg>
                Ask AI
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Link className="h-4 w-4 mr-2" />
                Copy link
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={securityFilter} onValueChange={setSecurityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="clean">Clean only</SelectItem>
                <SelectItem value="vpn">VPN detected</SelectItem>
                <SelectItem value="bot">Bot detected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by visitor ID, IP, country, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            {stats.total} events matching • {stats.uniqueCountries} countries • {stats.uniqueIPs} IP addresses
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('visitorId')}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      VISITOR ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('ipAddress')}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      IP ADDRESS
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('country')}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      LOCATION
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>BROWSER/OS</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('confidence')}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      CONFIDENCE
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>SECURITY</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('date')}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      DATE
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedEvents.map((event, index) => (
                  <TableRow key={`${event.requestId}-${index}`} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="text-sm font-mono">
                      <div className="max-w-[120px] truncate" title={event.visitorId}>
                        {event.visitorId}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{event.ipAddress}</TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <div className="font-medium">{event.country}</div>
                        <div className="text-xs text-muted-foreground">{event.city}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <div className="font-medium">{event.browser}</div>
                        <div className="text-xs text-muted-foreground">{event.os}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={`font-mono ${getConfidenceColor(event.confidence)}`}>
                        {(event.confidence * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {getSecurityBadge(event)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.date.toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                      })}{' '}
                      {event.date.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No events found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
