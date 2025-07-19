import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  AppBar, 
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  People as PeopleIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import Chart from '../components/Chart';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalCalls: number;
  totalLeads: number;
  successRate: number;
  recentCalls: number;
}

interface ChartData {
  date: string;
  calls: number;
  successful: number;
}

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    totalLeads: 0,
    successRate: 0,
    recentCalls: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchChartData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch contacts (leads)
      const contactsSnapshot = await getDocs(collection(db, 'contacts'));
      const totalLeads = contactsSnapshot.size;

      // Calculate total calls and success rate
      let totalCalls = 0;
      let successfulCalls = 0;
      
      contactsSnapshot.forEach(doc => {
        const data = doc.data();
        const callHistory = data.callHistory || [];
        totalCalls += callHistory.length;
        successfulCalls += callHistory.filter((call: any) => 
          call.outcome === 'Answered' && call.durationSeconds > 30
        ).length;
      });

      const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;
      
      // Recent calls (last 7 days)
      const recentCalls = contactsSnapshot.docs.reduce((count, doc) => {
        const data = doc.data();
        const callHistory = data.callHistory || [];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return count + callHistory.filter((call: any) => 
          new Date(call.time.toDate()) > weekAgo
        ).length;
      }, 0);

      setStats({
        totalCalls,
        totalLeads,
        successRate,
        recentCalls
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      // Generate sample data for the last 7 days
      const data: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          calls: Math.floor(Math.random() * 20) + 5,
          successful: Math.floor(Math.random() * 15) + 3,
        });
      }
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Leads', icon: <PersonIcon />, path: '/leads' },
    { text: 'Scripts', icon: <DescriptionIcon />, path: '/scripts' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleMenuClick = (path: string) => {
    if (path !== '/') {
      navigate(path);
    }
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ProDialer Admin
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} onClick={() => handleMenuClick(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
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
                      {stats.totalCalls}
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
                  <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Leads
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalLeads}
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
                      {stats.successRate}%
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
                  <NotificationsIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Recent Calls
                    </Typography>
                    <Typography variant="h4">
                      {stats.recentCalls}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Call Activity (Last 7 Days)
                </Typography>
                <Chart data={chartData} title="Call Activity" />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button variant="contained" fullWidth>
                    Add New Lead
                  </Button>
                  <Button variant="outlined" fullWidth>
                    View Reports
                  </Button>
                  <Button variant="outlined" fullWidth>
                    Manage Scripts
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 