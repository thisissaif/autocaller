import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi';
  notifications: {
    email: boolean;
    push: boolean;
    callAlerts: boolean;
    leadAssignments: boolean;
    missedCallReminders: boolean;
  };
  callSettings: {
    defaultInterval: number;
    maxRetries: number;
    autoDialEnabled: boolean;
    callTimeout: number;
  };
  system: {
    autoBackup: boolean;
    dataRetention: number;
    exportFormat: 'pdf' | 'csv' | 'both';
  };
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      callAlerts: true,
      leadAssignments: true,
      missedCallReminders: true,
    },
    callSettings: {
      defaultInterval: 10,
      maxRetries: 3,
      autoDialEnabled: true,
      callTimeout: 30,
    },
    system: {
      autoBackup: true,
      dataRetention: 90,
      exportFormat: 'both',
    },
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', user.uid));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showSnackbar('Error loading settings', 'error');
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', user.uid), settings);
      showSnackbar('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Error saving settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          callAlerts: true,
          leadAssignments: true,
          missedCallReminders: true,
        },
        callSettings: {
          defaultInterval: 10,
          maxRetries: 3,
          autoDialEnabled: true,
          callTimeout: 30,
        },
        system: {
          autoBackup: true,
          dataRetention: 90,
          exportFormat: 'both',
        },
      });
      showSnackbar('Settings reset to default', 'success');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleNotificationChange = (key: keyof Settings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleCallSettingChange = (key: keyof Settings['callSettings'], value: any) => {
    setSettings(prev => ({
      ...prev,
      callSettings: {
        ...prev.callSettings,
        [key]: value
      }
    }));
  };

  const handleSystemChange = (key: keyof Settings['system'], value: any) => {
    setSettings(prev => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: value
      }
    }));
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Settings</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetSettings}
          >
            Reset to Default
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Appearance Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Appearance"
              avatar={<PaletteIcon />}
            />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.theme}
                  label="Theme"
                  onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  label="Language"
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">Hindi</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Call Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Call Settings"
              avatar={<PhoneIcon />}
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.callSettings.autoDialEnabled}
                    onChange={(e) => handleCallSettingChange('autoDialEnabled', e.target.checked)}
                  />
                }
                label="Enable Auto Dialing"
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>Default Call Interval (seconds)</Typography>
              <Slider
                value={settings.callSettings.defaultInterval}
                onChange={(_, value) => handleCallSettingChange('defaultInterval', value)}
                min={5}
                max={60}
                step={5}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <TextField
                label="Max Retries"
                type="number"
                value={settings.callSettings.maxRetries}
                onChange={(e) => handleCallSettingChange('maxRetries', parseInt(e.target.value))}
                fullWidth
                sx={{ mb: 2 }}
              />

              <TextField
                label="Call Timeout (seconds)"
                type="number"
                value={settings.callSettings.callTimeout}
                onChange={(e) => handleCallSettingChange('callTimeout', parseInt(e.target.value))}
                fullWidth
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Notifications"
              avatar={<NotificationsIcon />}
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Email Notifications"
                    secondary="Receive notifications via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Push Notifications"
                    secondary="Receive push notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Call Alerts"
                    secondary="Get notified about call events"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.callAlerts}
                      onChange={() => handleNotificationChange('callAlerts')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Lead Assignments"
                    secondary="Notify when leads are assigned"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.leadAssignments}
                      onChange={() => handleNotificationChange('leadAssignments')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Missed Call Reminders"
                    secondary="Remind about missed calls"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.missedCallReminders}
                      onChange={() => handleNotificationChange('missedCallReminders')}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="System Settings"
              avatar={<SettingsIcon />}
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.system.autoBackup}
                    onChange={(e) => handleSystemChange('autoBackup', e.target.checked)}
                  />
                }
                label="Auto Backup"
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>Data Retention (days)</Typography>
              <Slider
                value={settings.system.dataRetention}
                onChange={(_, value) => handleSystemChange('dataRetention', value)}
                min={30}
                max={365}
                step={30}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={settings.system.exportFormat}
                  label="Export Format"
                  onChange={(e) => handleSystemChange('exportFormat', e.target.value)}
                >
                  <MenuItem value="pdf">PDF Only</MenuItem>
                  <MenuItem value="csv">CSV Only</MenuItem>
                  <MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Settings Summary */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Current Settings Summary" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">Theme</Typography>
                  <Chip label={settings.theme} size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">Language</Typography>
                  <Chip label={settings.language === 'en' ? 'English' : 'Hindi'} size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">Call Interval</Typography>
                  <Chip label={`${settings.callSettings.defaultInterval}s`} size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2" color="textSecondary">Export Format</Typography>
                  <Chip label={settings.system.exportFormat.toUpperCase()} size="small" />
                </Grid>
              </Grid>
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

export default Settings; 