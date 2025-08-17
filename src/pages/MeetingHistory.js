import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MeetingHistory = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <HistoryIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          会议历史功能开发中
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          这里将展示所有历史会议记录和讨论回放
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          即将支持：会议列表、讨论回放、关键观点提取、争议点分析等功能
        </Typography>
        <Button variant="contained" onClick={() => navigate('/hall')}>
          返回董事会大厅
        </Button>
      </Paper>
    </Container>
  );
};

export default MeetingHistory;