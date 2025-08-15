import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MeetingRoom = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <ConstructionIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          会议室功能开发中
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          这里将是董事们进行实时讨论和辩论的地方
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          即将支持：多董事同时讨论、实时发言、智能辩论模式、会议记录等功能
        </Typography>
        <Button variant="contained" onClick={() => navigate('/hall')}>
          返回董事会大厅
        </Button>
      </Paper>
    </Container>
  );
};

export default MeetingRoom;