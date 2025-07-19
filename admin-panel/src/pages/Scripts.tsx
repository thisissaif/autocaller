import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  History as HistoryIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

interface Script {
  id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

const Scripts: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isActive: false
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const categories = ['Sales', 'Follow-up', 'Customer Service', 'Survey', 'General'];
  const scriptTemplates = [
    {
      title: 'Sales Introduction',
      content: `Hi [Name], this is [Your Name] from [Company Name]. 

I hope you're having a great day! I'm calling because we have a special offer that I think would be perfect for you.

[Brief value proposition]

Would you be interested in learning more about how this could benefit you?`,
      category: 'Sales'
    },
    {
      title: 'Follow-up Call',
      content: `Hi [Name], this is [Your Name] calling from [Company Name].

I wanted to follow up on our previous conversation about [topic]. 

How have things been going since we last spoke?

[Ask about their current situation and needs]`,
      category: 'Follow-up'
    },
    {
      title: 'Customer Service',
      content: `Hi [Name], this is [Your Name] from [Company Name].

I'm calling to check in on your recent experience with us. 

How was everything with your [product/service]?

Is there anything we can do to improve your experience?`,
      category: 'Customer Service'
    }
  ];

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const q = query(collection(db, 'scripts'), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const scriptsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Script[];
      setScripts(scriptsData);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      showSnackbar('Error fetching scripts', 'error');
    }
  };

  const handleOpenDialog = (script?: Script) => {
    if (script) {
      setEditingScript(script);
      setFormData({
        title: script.title,
        content: script.content,
        category: script.category,
        isActive: script.isActive
      });
    } else {
      setEditingScript(null);
      setFormData({
        title: '',
        content: '',
        category: '',
        isActive: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingScript(null);
  };

  const handleSubmit = async () => {
    try {
      const now = new Date();
      const scriptData = {
        ...formData,
        updatedAt: now,
        ...(editingScript ? { version: editingScript.version + 1 } : { 
          createdAt: now, 
          version: 1,
          isActive: true 
        })
      };

      if (editingScript) {
        await updateDoc(doc(db, 'scripts', editingScript.id), scriptData);
        showSnackbar('Script updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'scripts'), scriptData);
        showSnackbar('Script added successfully', 'success');
      }

      handleCloseDialog();
      fetchScripts();
    } catch (error) {
      console.error('Error saving script:', error);
      showSnackbar('Error saving script', 'error');
    }
  };

  const handleDelete = async (scriptId: string) => {
    if (window.confirm('Are you sure you want to delete this script?')) {
      try {
        await deleteDoc(doc(db, 'scripts', scriptId));
        showSnackbar('Script deleted successfully', 'success');
        fetchScripts();
      } catch (error) {
        console.error('Error deleting script:', error);
        showSnackbar('Error deleting script', 'error');
      }
    }
  };

  const handleUseTemplate = (template: any) => {
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      isActive: false
    });
    setOpenDialog(true);
  };

  const handleCopyScript = (script: Script) => {
    navigator.clipboard.writeText(script.content);
    showSnackbar('Script copied to clipboard', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Script Editor</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Script
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Scripts List */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Your Scripts
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {scripts.map((script) => (
              <Card key={script.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom>
                        {script.title}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip label={script.category} size="small" />
                        <Chip 
                          label={`v${script.version}`} 
                          size="small" 
                          variant="outlined"
                        />
                        {script.isActive && (
                          <Chip label="Active" size="small" color="success" />
                        )}
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {script.content}
                      </Typography>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                      <IconButton onClick={() => handleCopyScript(script)}>
                        <CopyIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenDialog(script)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(script.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
            {scripts.length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No scripts found. Create your first script or use a template below.
                </Typography>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Templates */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Script Templates
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {scriptTemplates.map((template, index) => (
              <Card key={index}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {template.title}
                  </Typography>
                  <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {template.content}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingScript ? 'Edit Script' : 'Add New Script'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Script Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Script Content"
              multiline
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              helperText="Use [Name], [Company], etc. for dynamic placeholders"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<SaveIcon />}>
            {editingScript ? 'Update Script' : 'Save Script'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default Scripts; 