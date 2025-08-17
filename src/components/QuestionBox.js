import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';

const QuestionBox = ({ meetingId, onQuestionSubmitted }) => {
  const [question, setQuestion] = useState('');
  const [askerName, setAskerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/meetings/${meetingId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          asker_name: askerName.trim() || '用户',
          question_type: 'general'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setQuestion('');
        setIsExpanded(false);
        if (onQuestionSubmitted) {
          onQuestionSubmitted(result.data);
        }
        
        // 自动生成董事回应
        const responseRes = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/meetings/${meetingId}/questions/${result.data.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const responseResult = await responseRes.json();
        if (responseResult.success && onQuestionSubmitted) {
          onQuestionSubmitted({ 
            ...result.data, 
            responses: responseResult.data.responses 
          });
        }
      }
    } catch (error) {
      console.error('提问失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, border: '2px dashed #e0e0e0' }}>
      <Box display="flex" alignItems="center" mb={1}>
        <QuestionIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h3">
          向董事们提问
        </Typography>
        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ ml: 'auto' }}
        >
          <ExpandMoreIcon 
            sx={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }} 
          />
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="输入你想问董事们的问题..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
          />
          
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              size="small"
              placeholder="你的称呼（可选）"
              value={askerName}
              onChange={(e) => setAskerName(e.target.value)}
              sx={{ width: 150 }}
              disabled={isSubmitting}
            />
            
            <Button
              type="submit"
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
              disabled={!question.trim() || isSubmitting}
              sx={{ ml: 'auto' }}
            >
              {isSubmitting ? '提问中...' : '提问'}
            </Button>
          </Box>
        </Box>
      </Collapse>

      {!isExpanded && (
        <Box textAlign="center">
          <Chip 
            label="点击展开提问框" 
            variant="outlined" 
            onClick={() => setIsExpanded(true)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default QuestionBox;