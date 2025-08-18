import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  Share as ShareIcon,
  Reply as ReplyIcon,
  TrendingUp as TrendingIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FavoriteButton from './FavoriteButton';

const StatementDisplay = ({ 
  statement, 
  index, 
  statements, 
  meeting, 
  onShareQuote, 
  onRebuttal 
}) => {
  const director = statement.Director;
  const isUserQuestion = statement.content_type === 'user_question';
  const discussionMode = meeting?.discussion_mode || 'round_robin';
  
  // 检查是否是新轮次
  const isNewRound = index === 0 || statement.round_number !== statements[index - 1]?.round_number;
  
  // 辩论模式：判断正反方
  const isProSide = statement.sequence_in_round % 2 === 1;
  
  // 获取模式特定的样式
  const getModeSpecificStyle = () => {
    switch (discussionMode) {
      case 'debate':
        if (isUserQuestion) return { bg: '#E3F2FD', border: '2px solid #1565C0' };
        return {
          bg: isProSide ? '#E8F5E8' : '#FFEBEE',
          border: isProSide ? '2px solid #2E7D32' : '2px solid #C62828',
          alignSelf: isProSide ? 'flex-start' : 'flex-end',
          maxWidth: '85%'
        };
      case 'focus':
        return {
          bg: isUserQuestion ? '#E3F2FD' : '#F3E5F5',
          border: isUserQuestion ? '2px solid #1565C0' : `2px solid #7B1FA2`,
          borderLeft: isUserQuestion ? undefined : '6px solid #7B1FA2'
        };
      case 'free':
        return {
          bg: isUserQuestion ? '#E3F2FD' : '#E8F5E8',
          border: isUserQuestion ? '2px solid #1565C0' : '1px solid #4CAF50',
          borderRadius: '16px'
        };
      default: // round_robin
        return {
          bg: isUserQuestion ? '#E3F2FD' : '#FAFAFA',
          border: isUserQuestion ? '2px solid #1565C0' : '1px solid #E0E0E0'
        };
    }
  };

  const modeStyle = getModeSpecificStyle();

  // 获取发言者标识
  const getSpeakerLabel = () => {
    if (isUserQuestion) return '用户提问';
    
    switch (discussionMode) {
      case 'debate':
        return `${director?.name} (${isProSide ? '正方' : '反方'})`;
      case 'focus':
        return `${director?.name} (第${statement.round_number}层)`;
      case 'free':
        return `${director?.name} (${statement.sequence_in_round})`;
      default:
        return director?.name;
    }
  };

  // 获取头像颜色
  const getAvatarColor = () => {
    if (isUserQuestion) return '#1565C0';
    
    switch (discussionMode) {
      case 'debate':
        return isProSide ? '#2E7D32' : '#C62828';
      case 'focus':
        return '#7B1FA2';
      case 'free':
        return '#388E3C';
      default:
        return '#F57C00';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: discussionMode === 'debate' ? 'column' : 'row',
      alignItems: discussionMode === 'debate' ? modeStyle.alignSelf : 'stretch',
      width: discussionMode === 'debate' ? modeStyle.maxWidth : '100%',
      mb: 2
    }}>
      <Card sx={{ 
        flex: 1,
        backgroundColor: modeStyle.bg,
        border: modeStyle.border,
        borderLeft: modeStyle.borderLeft,
        borderRadius: modeStyle.borderRadius || '8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)'
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={isUserQuestion ? null : director?.avatar_url}
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                backgroundColor: getAvatarColor(),
                border: '3px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {isUserQuestion ? <QuestionIcon /> : <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: isUserQuestion ? '#1565C0' : '#333',
                  fontSize: '1.1rem'
                }}
              >
                {getSpeakerLabel()}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
              >
                {isUserQuestion ? '会议参与者' : director?.title}
                {statement.created_at && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1, 
                      color: '#888',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    · {format(new Date(statement.created_at), 'HH:mm', { locale: zhCN })}
                  </Typography>
                )}
              </Typography>
            </Box>
            
            {/* 模式特定的标签 */}
            {discussionMode === 'debate' && !isUserQuestion && (
              <Chip 
                label={isProSide ? '正方' : '反方'} 
                size="small" 
                color={isProSide ? 'success' : 'error'}
                sx={{ mr: 1 }}
              />
            )}
            {discussionMode === 'focus' && !isUserQuestion && (
              <Chip 
                label={`第${statement.round_number}层`} 
                size="small" 
                color="secondary"
                sx={{ mr: 1 }}
              />
            )}
            
            {statement.content_type === 'opening' && (
              <Chip label="开场" size="small" color="success" />
            )}
            {statement.content_type === 'closing' && (
              <Chip label="结语" size="small" color="error" />
            )}
            {statement.content_type === 'user_question' && (
              <Chip label="用户提问" size="small" color="info" />
            )}
            
            {!isUserQuestion && (
              <>
                <FavoriteButton
                  statementId={statement.id}
                  favoriteType="statement"
                />
                <IconButton
                  size="small"
                  onClick={() => onShareQuote(statement.id)}
                  title="生成金句卡片"
                >
                  <ShareIcon />
                </IconButton>
                
                {/* 辩论模式特有的反驳按钮 */}
                {discussionMode === 'debate' && onRebuttal && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon />}
                    onClick={() => onRebuttal(statement)}
                    variant="outlined"
                    color={isProSide ? 'error' : 'success'}
                    sx={{ ml: 1 }}
                  >
                    反驳
                  </Button>
                )}
              </>
            )}
          </Box>
          
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontSize: isUserQuestion ? '1rem' : '1.1rem',
              lineHeight: 1.7,
              color: isUserQuestion ? '#1565C0' : '#333',
              fontWeight: isUserQuestion ? 500 : 400,
              letterSpacing: '0.02em',
              mt: 1
            }}
          >
            {statement.content}
          </Typography>
          
          {/* 辩论模式显示回应关系 */}
          {discussionMode === 'debate' && statement.response_to && (
            <Paper sx={{ mt: 2, p: 1, backgroundColor: '#FFF3E0', border: '1px solid #FF9800' }}>
              <Typography variant="caption" color="#F57C00" fontWeight="bold">
                🔥 反驳了上一位发言
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StatementDisplay;