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
  CircularProgress,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Grid,
  ButtonGroup
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';

const QuestionBox = ({ meetingId, onQuestionSubmitted, participants = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [question, setQuestion] = useState('');
  const [askerName, setAskerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [questionScope, setQuestionScope] = useState('all');
  const [targetDirector, setTargetDirector] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    // 验证定向提问必须选择董事
    if (questionScope === 'specific' && !targetDirector) {
      alert('请选择要提问的董事');
      return;
    }

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
          question_type: 'general',
          question_scope: questionScope,
          target_director_id: questionScope === 'specific' ? targetDirector : null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setQuestion('');
        setIsExpanded(false);
        setQuestionScope('all');
        setTargetDirector('');
        if (onQuestionSubmitted) {
          onQuestionSubmitted(result.data);
        }
        
        // 自动生成董事发言回应问题
        const autoGenerateResponses = async () => {
          try {
            if (questionScope === 'all') {
              // 全员提问：依次生成所有董事的发言
              for (let i = 0; i < participants.length; i++) {
                const generateRes = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/meetings/${meetingId}/next-statement`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                
                const generateResult = await generateRes.json();
                if (generateResult.success) {
                  console.log(`第${i + 1}位董事发言生成成功`);
                  // 每次生成后短暂延迟
                  if (i < participants.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                  }
                } else {
                  console.error(`第${i + 1}位董事发言生成失败:`, generateResult.error);
                  break;
                }
              }
            } else {
              // 定向提问：生成一次发言
              const generateRes = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/meetings/${meetingId}/next-statement`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              const generateResult = await generateRes.json();
              if (generateResult.success) {
                console.log('定向董事发言生成成功');
              }
            }
            
            // 触发会议数据刷新
            setTimeout(() => {
              if (onQuestionSubmitted) {
                onQuestionSubmitted(result.data);
              }
            }, 1000);
          } catch (generateError) {
            console.error('自动生成董事发言失败:', generateError);
          }
        };
        
        // 异步执行自动生成
        autoGenerateResponses();
      }
    } catch (error) {
      console.error('提问失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 2, mb: 2, border: '2px dashed #e0e0e0' }}>
      <Box display="flex" alignItems="center" mb={1}>
        <QuestionIcon color="primary" sx={{ mr: 1, fontSize: isMobile ? 20 : 24 }} />
        <Typography variant={isMobile ? "subtitle1" : "h6"} component="h3" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
          向董事们提问
        </Typography>
        <IconButton
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ ml: 'auto', minHeight: isMobile ? 44 : 'auto' }}
          size={isMobile ? 'medium' : 'small'}
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
            rows={isMobile ? 3 : 2}
            placeholder="输入你想问董事们的问题..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            sx={{ mb: 2 }}
            disabled={isSubmitting}
            size={isMobile ? 'medium' : 'medium'}
          />
          
          {/* 提问类型选择 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              提问方式：
            </Typography>
            <ButtonGroup 
              variant="outlined" 
              size={isMobile ? 'medium' : 'small'}
              fullWidth={isMobile}
              value={questionScope}
              disabled={isSubmitting}
            >
              <Button
                variant={questionScope === 'all' ? 'contained' : 'outlined'}
                startIcon={<GroupIcon />}
                onClick={() => setQuestionScope('all')}
                sx={{ minHeight: isMobile ? 44 : 'auto' }}
              >
                向全体董事提问
              </Button>
              <Button
                variant={questionScope === 'specific' ? 'contained' : 'outlined'}
                startIcon={<PersonIcon />}
                onClick={() => setQuestionScope('specific')}
                sx={{ minHeight: isMobile ? 44 : 'auto' }}
              >
                向指定董事提问
              </Button>
            </ButtonGroup>
          </Box>

          {/* 指定董事选择器 */}
          {questionScope === 'specific' && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size={isMobile ? 'medium' : 'small'}>
                <InputLabel>选择董事</InputLabel>
                <Select
                  value={targetDirector}
                  onChange={(e) => setTargetDirector(e.target.value)}
                  disabled={isSubmitting}
                  label="选择董事"
                >
                  {participants.map((participant) => (
                    <MenuItem key={participant.director_id} value={participant.director_id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={participant.director?.avatar_url}
                          sx={{ width: 24, height: 24 }}
                        >
                          <PersonIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography>
                          {participant.director?.name} - {participant.director?.title}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          
          <Box 
            display="flex" 
            alignItems={isMobile ? "stretch" : "center"} 
            gap={2}
            flexDirection={isMobile ? "column" : "row"}
          >
            <TextField
              size={isMobile ? "medium" : "small"}
              placeholder="你的称呼（可选）"
              value={askerName}
              onChange={(e) => setAskerName(e.target.value)}
              sx={{ width: isMobile ? '100%' : 150 }}
              disabled={isSubmitting}
              fullWidth={isMobile}
            />
            
            <Button
              type="submit"
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
              disabled={!question.trim() || isSubmitting}
              sx={{ 
                ml: isMobile ? 0 : 'auto',
                minHeight: isMobile ? 48 : 'auto'
              }}
              size={isMobile ? 'large' : 'medium'}
              fullWidth={isMobile}
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
            sx={{ 
              cursor: 'pointer',
              minHeight: isMobile ? 44 : 'auto',
              fontSize: isMobile ? '0.95rem' : '0.875rem',
              px: isMobile ? 2 : 1
            }}
            size={isMobile ? 'medium' : 'small'}
          />
        </Box>
      )}
    </Paper>
  );
};

export default QuestionBox;