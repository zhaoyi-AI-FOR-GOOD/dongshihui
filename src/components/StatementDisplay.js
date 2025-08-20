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
  Paper,
  useMediaQuery,
  useTheme
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
  const isQuestionResponse = statement.content_type === 'question_response';
  const discussionMode = meeting?.discussion_mode || 'round_robin';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 检查是否是新轮次
  const isNewRound = index === 0 || statement.round_number !== statements[index - 1]?.round_number;
  
  // 辩论模式：判断正反方
  const isProSide = statement.sequence_in_round % 2 === 1;
  
  // 获取模式特定的样式
  const getModeSpecificStyle = () => {
    // 用户提问的样式
    if (isUserQuestion) {
      return { bg: '#E3F2FD', border: '2px solid #1565C0' };
    }
    
    // 董事回复用户问题的样式
    if (isQuestionResponse) {
      return { 
        bg: '#FFF8E1', 
        border: '2px solid #FFA000',
        borderLeft: '6px solid #FFA000'
      };
    }
    
    switch (discussionMode) {
      case 'debate':
        return {
          bg: isProSide ? '#E8F5E8' : '#FFEBEE',
          border: isProSide ? '2px solid #2E7D32' : '2px solid #C62828',
          alignSelf: isProSide ? 'flex-start' : 'flex-end',
          maxWidth: '85%'
        };
      case 'focus':
        return {
          bg: '#F3E5F5',
          border: `2px solid #7B1FA2`,
          borderLeft: '6px solid #7B1FA2'
        };
      case 'free':
        return {
          bg: '#E8F5E8',
          border: '1px solid #4CAF50',
          borderRadius: '16px'
        };
      case 'board':
        return {
          bg: '#FFF3E0',
          border: '2px solid #FF6B35',
          borderLeft: '6px solid #FF6B35'
        };
      default: // round_robin
        return {
          bg: '#FAFAFA',
          border: '1px solid #E0E0E0'
        };
    }
  };

  const modeStyle = getModeSpecificStyle();

  // 获取发言者标识
  const getSpeakerLabel = () => {
    if (isUserQuestion) return '用户提问';
    if (isQuestionResponse) return `${director?.name} (回复提问)`;
    
    switch (discussionMode) {
      case 'debate':
        return `${director?.name} (${isProSide ? '正方' : '反方'})`;
      case 'focus':
        return `${director?.name} (第${statement.round_number}层)`;
      case 'free':
        return `${director?.name} (${statement.sequence_in_round})`;
      case 'board':
        return `${director?.name} (董事)`;
      default:
        return director?.name;
    }
  };

  // 获取头像颜色
  const getAvatarColor = () => {
    if (isUserQuestion) return '#1565C0';
    if (isQuestionResponse) return '#FFA000';
    
    switch (discussionMode) {
      case 'debate':
        return isProSide ? '#2E7D32' : '#C62828';
      case 'focus':
        return '#7B1FA2';
      case 'free':
        return '#388E3C';
      case 'board':
        return '#FF6B35';
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
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={(isUserQuestion || isQuestionResponse) ? director?.avatar_url : director?.avatar_url}
              sx={{ 
                width: isMobile ? 36 : 40, 
                height: isMobile ? 36 : 40, 
                mr: isMobile ? 1.5 : 2,
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
                  color: isUserQuestion ? '#1565C0' : isQuestionResponse ? '#FFA000' : '#333',
                  fontSize: isMobile ? '1rem' : '1.1rem'
                }}
              >
                {getSpeakerLabel()}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontWeight: 500,
                  fontSize: isMobile ? '0.85rem' : '0.9rem'
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
            {statement.content_type === 'question_response' && (
              <Chip label="回复提问" size="small" color="warning" />
            )}
            
            {!isUserQuestion && (
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-end' : 'center'
              }}>
                <FavoriteButton
                  statementId={isQuestionResponse ? null : statement.id}
                  responseId={isQuestionResponse ? statement.id : null}
                  favoriteType={isQuestionResponse ? "response" : "statement"}
                />
                <IconButton
                  size={isMobile ? 'medium' : 'small'}
                  onClick={() => onShareQuote(statement.id)}
                  title="生成金句卡片"
                  sx={{ minHeight: isMobile ? 44 : 'auto' }}
                >
                  <ShareIcon />
                </IconButton>
                
                {/* 辩论模式特有的反驳按钮 */}
                {discussionMode === 'debate' && onRebuttal && (
                  <Button
                    size={isMobile ? 'medium' : 'small'}
                    startIcon={<ReplyIcon />}
                    onClick={() => onRebuttal(statement)}
                    variant="outlined"
                    color={isProSide ? 'error' : 'success'}
                    sx={{ 
                      ml: isMobile ? 0 : 1,
                      mt: isMobile ? 0.5 : 0,
                      minHeight: isMobile ? 44 : 'auto'
                    }}
                  >
                    反驳
                  </Button>
                )}
              </Box>
            )}
          </Box>
          
          <Typography 
            variant="body1" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontSize: isMobile ? (isUserQuestion ? '0.95rem' : '1rem') : (isUserQuestion ? '1rem' : '1.1rem'),
              lineHeight: isMobile ? 1.6 : 1.7,
              color: isUserQuestion ? '#1565C0' : isQuestionResponse ? '#E65100' : '#333',
              fontWeight: isUserQuestion ? 500 : isQuestionResponse ? 500 : 400,
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