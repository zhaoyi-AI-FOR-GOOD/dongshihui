import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer as QuestionIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FavoriteButton from './FavoriteButton';

const QuestionResponseList = ({ questions = [], onQuestionsUpdate }) => {
  if (questions.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">
          还没有用户提问，成为第一个提问的人吧！
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <QuestionIcon sx={{ mr: 1 }} />
        用户提问 ({questions.length})
      </Typography>
      
      {questions.map((question) => (
        <Accordion key={question.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ width: '100%' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {question.question}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={question.asker_name || '用户'} 
                    size="small" 
                    icon={<PersonIcon />}
                    variant="outlined"
                  />
                  <Chip 
                    label={question.status === 'answered' ? '已回应' : '待回应'} 
                    size="small" 
                    color={question.status === 'answered' ? 'success' : 'warning'}
                  />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {question.created_at ? formatDistanceToNow(new Date(question.created_at), { 
                  addSuffix: true, 
                  locale: zhCN 
                }) : '时间未知'}
              </Typography>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            {question.responses && question.responses.length > 0 ? (
              <Box>
                <Typography variant="body2" color="info.main" sx={{ fontStyle: 'italic' }}>
                  ✅ 董事们已在会议讨论记录中回复了此问题 ({question.responses.length}位董事回复)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  请在左侧的"会议讨论记录"中查看董事们的详细回复内容。
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                董事们还未回应此问题
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default QuestionResponseList;