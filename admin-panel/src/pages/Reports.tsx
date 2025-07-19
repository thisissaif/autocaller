import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import Chart from '../components/Chart';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  status: string;
  callHistory: any[];
  createdAt: any;
  updatedAt: any;
}

interface ReportData {
  totalLeads: number;
  totalCalls: number;
  successRate: number;
  averageCallDuration: number;
  callsByStatus: { [key: string]: number };
  callsByTag: { [key: string]: number };
  recentActivity: any[];
  chartData: any[];
}

const Reports: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    totalLeads: 0,
    totalCalls: 0,
    successRate: 0,
    averageCallDuration: 0,
    callsByStatus: {},
    callsByTag: {},
    recentActivity: [],
    chartData: []
  });
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];

      setContacts(contactsData);
      calculateReportData(contactsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (contactsData: Contact[]) => {
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    let totalCalls = 0;
    let successfulCalls = 0;
    let totalDuration = 0;
    const callsByStatus: { [key: string]: number } = {};
    const callsByTag: { [key: string]: number } = {};
    const recentActivity: any[] = [];
    const chartData: any[] = [];

    // Generate chart data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calls: 0,
        successful: 0
      });
    }

    contactsData.forEach(contact => {
      const callHistory = contact.callHistory || [];
      
      callHistory.forEach(call => {
        const callDate = call.time.toDate();
        if (callDate >= startDate) {
          totalCalls++;
          totalDuration += call.durationSeconds || 0;

          // Count by status
          callsByStatus[contact.status] = (callsByStatus[contact.status] || 0) + 1;

          // Count by tags
          contact.tags.forEach(tag => {
            callsByTag[tag] = (callsByTag[tag] || 0) + 1;
          });

          // Count successful calls
          if (call.outcome === 'Answered' && (call.durationSeconds || 0) > 30) {
            successfulCalls++;
          }

          // Add to recent activity
          recentActivity.push({
            name: contact.name,
            phone: contact.phone,
            outcome: call.outcome,
            duration: call.durationSeconds || 0,
            date: callDate,
            status: contact.status
          });

          // Add to chart data
          const chartIndex = chartData.findIndex(item => 
            new Date(item.date).toDateString() === callDate.toDateString()
          );
          if (chartIndex !== -1) {
            chartData[chartIndex].calls++;
            if (call.outcome === 'Answered' && (call.durationSeconds || 0) > 30) {
              chartData[chartIndex].successful++;
            }
          }
        }
      });
    });

    // Sort recent activity by date
    recentActivity.sort((a, b) => b.date.getTime() - a.date.getTime());

    setReportData({
      totalLeads: contactsData.length,
      totalCalls,
      successRate: totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0,
      averageCallDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      callsByStatus,
      callsByTag,
      recentActivity: recentActivity.slice(0, 10), // Top 10 recent activities
      chartData
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('ProDialer Analytics Report', 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Report Period: Last ${dateRange}`, 20, 35);
    
    // Summary stats
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, 50);
    doc.setFontSize(10);
    doc.text(`Total Leads: ${reportData.totalLeads}`, 20, 65);
    doc.text(`Total Calls: ${reportData.totalCalls}`, 20, 75);
    doc.text(`Success Rate: ${reportData.successRate}%`, 20, 85);
    doc.text(`Average Call Duration: ${reportData.averageCallDuration}s`, 20, 95);

    // Calls by status
    doc.setFontSize(14);
    doc.text('Calls by Status', 20, 115);
    doc.setFontSize(10);
    let yPos = 130;
    Object.entries(reportData.callsByStatus).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, 20, yPos);
      yPos += 10;
    });

    // Recent activity table
    doc.setFontSize(14);
    doc.text('Recent Call Activity', 20, yPos + 10);
    
    const tableData = reportData.recentActivity.map(activity => [
      activity.name,
      activity.phone,
      activity.outcome,
      `${activity.duration}s`,
      activity.status
    ]);

    (doc as any).autoTable({
      startY: yPos + 20,
      head: [['Name', 'Phone', 'Outcome', 'Duration', 'Status']],
      body: tableData,
      theme: 'grid'
    });

    doc.save(`prodialer-report-${dateRange}.pdf`);
    showSnackbar('PDF exported successfully', 'success');
  };

  const exportToCSV = () => {
    const csvData = contacts.map(contact => ({
      Name: contact.name,
      Phone: contact.phone,
      Email: contact.email || '',
      Tags: contact.tags.join(', '),
      Status: contact.status,
      TotalCalls: contact.callHistory?.length || 0,
      CreatedAt: contact.createdAt?.toDate?.()?.toLocaleDateString() || '',
      UpdatedAt: contact.updatedAt?.toDate?.()?.toLocaleDateString() || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prodialer-leads-${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar('CSV exported successfully', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<CsvIcon />}
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Leads
                  </Typography>
                  <Typography variant="h4">
                    {reportData.totalLeads}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PhoneIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Calls
                  </Typography>
                  <Typography variant="h4">
                    {reportData.totalCalls}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {reportData.successRate}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssessmentIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Duration
                  </Typography>
                  <Typography variant="h4">
                    {reportData.averageCallDuration}s
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Activity (Last 7 Days)
              </Typography>
              <Chart data={reportData.chartData} title="Call Activity" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calls by Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {Object.entries(reportData.callsByStatus).map(([status, count]) => (
                  <Box key={status} display="flex" justifyContent="space-between" alignItems="center">
                    <Chip label={status} size="small" />
                    <Typography variant="body2">{count}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Call Activity
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Outcome</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{activity.name}</TableCell>
                        <TableCell>{activity.phone}</TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.outcome} 
                            size="small"
                            color={activity.outcome === 'Answered' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{activity.duration}s</TableCell>
                        <TableCell>
                          <Chip 
                            label={activity.status} 
                            size="small"
                            color={activity.status === 'Interested' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{activity.date.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports; 