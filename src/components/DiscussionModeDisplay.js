import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  Grid,
  Badge
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Forum as ForumIcon,
  Gavel as GavelIcon,
  CenterFocusStrong as FocusIcon,
  Diversity3 as FreeIcon,
  HowToVote as BoardIcon,
  Person as PersonIcon,
  TrendingUp as TrendingIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';

const DiscussionModeDisplay = ({ 
  meeting, 
  participants, 
  statements, 
  currentSpeakerIndex,
  nextSpeakerIndex 
}) => {
  const discussionMode = meeting?.discussion_mode || 'round_robin';
  
  // 模式配置
  const modeConfigs = {
    round_robin: {
      name: '轮流发言',
      icon: <ScheduleIcon />,
      color: '#1565C0',
      bgColor: '#E3F2FD',
      description: '严格按顺序轮流发言'
    },
    debate: {
      name: '辩论模式', 
      icon: <GavelIcon />,
      color: '#D32F2F',
      bgColor: '#FFEBEE',
      description: '正反方对抗辩论'
    },
    focus: {
      name: '聚焦讨论',
      icon: <FocusIcon />,
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
      description: '围绕核心议题深入'
    },
    free: {
      name: '自由发言',
      icon: <FreeIcon />,
      color: '#388E3C',
      bgColor: '#E8F5E8',
      description: '灵活互动随机发言'
    },
    board: {
      name: '董事会',
      icon: <BoardIcon />,
      color: '#FF6B35',
      bgColor: '#FFF3E0',
      description: '先讨论后投票表决'
    }
  };

  const config = modeConfigs[discussionMode];

  // 轮流发言模式的发言顺序显示
  const renderRoundRobinMode = () => (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {config.icon}
        <Typography variant="h6" sx={{ ml: 1, color: config.color, fontWeight: 600 }}>
          {config.name}
        </Typography>
        <Chip 
          label={config.description} 
          size="small" 
          sx={{ ml: 2, backgroundColor: config.color, color: 'white' }}
        />
      </Box>
      
      <Typography variant="subtitle2" gutterBottom>发言顺序：</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {participants.map((participant, index) => {
          const isCurrent = index === currentSpeakerIndex;
          const isNext = index === nextSpeakerIndex;
          const hasSpokeThisRound = statements.some(s => 
            s.director_id === participant.director_id && 
            s.round_number === meeting.current_round
          );
          
          return (
            <Chip
              key={participant.director_id}
              avatar={
                <Avatar src={participant.director?.avatar_url} sx={{ width: 24, height: 24 }}>
                  <PersonIcon sx={{ fontSize: 14 }} />
                </Avatar>
              }
              label={`${index + 1}. ${participant.director?.name}`}
              variant={isCurrent ? "filled" : "outlined"}
              color={isCurrent ? "primary" : isNext ? "secondary" : "default"}
              sx={{
                backgroundColor: isCurrent ? config.color : isNext ? '#FFA726' : undefined,
                opacity: hasSpokeThisRound ? 0.6 : 1,
                border: isNext ? '2px solid #FFA726' : undefined
              }}
            />
          );
        })}
      </Box>
      
      {nextSpeakerIndex !== -1 && (
        <Typography variant="body2" sx={{ mt: 1, color: config.color, fontWeight: 500 }}>
          下一位发言：{participants[nextSpeakerIndex]?.director?.name}
        </Typography>
      )}
    </Paper>
  );

  // 辩论模式的正反方显示
  const renderDebateMode = () => {
    const proSide = participants.filter((_, index) => index % 2 === 0);
    const conSide = participants.filter((_, index) => index % 2 === 1);
    
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {config.icon}
          <Typography variant="h6" sx={{ ml: 1, color: config.color, fontWeight: 600 }}>
            {config.name}
          </Typography>
          <Chip 
            label={config.description} 
            size="small" 
            sx={{ ml: 2, backgroundColor: config.color, color: 'white' }}
          />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#E8F5E8', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="#2E7D32" fontWeight="bold">正方</Typography>
              {proSide.map(participant => (
                <Chip
                  key={participant.director_id}
                  avatar={<Avatar src={participant.director?.avatar_url} sx={{ width: 20, height: 20 }} />}
                  label={participant.director?.name}
                  size="small"
                  sx={{ m: 0.5, backgroundColor: '#C8E6C9' }}
                />
              ))}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center', p: 1, backgroundColor: '#FFEBEE', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="#C62828" fontWeight="bold">反方</Typography>
              {conSide.map(participant => (
                <Chip
                  key={participant.director_id}
                  avatar={<Avatar src={participant.director?.avatar_url} sx={{ width: 20, height: 20 }} />}
                  label={participant.director?.name}
                  size="small"
                  sx={{ m: 0.5, backgroundColor: '#FFCDD2' }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // 聚焦讨论模式的议题进展显示
  const renderFocusMode = () => {
    const progress = Math.min((statements.length / (participants.length * meeting.max_rounds)) * 100, 100);
    
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {config.icon}
          <Typography variant="h6" sx={{ ml: 1, color: config.color, fontWeight: 600 }}>
            {config.name}
          </Typography>
          <Chip 
            label={config.description} 
            size="small" 
            sx={{ ml: 2, backgroundColor: config.color, color: 'white' }}
          />
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>讨论深度进展：</Typography>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mb: 1, 
            height: 8, 
            borderRadius: 4,
            backgroundColor: '#F3E5F5',
            '& .MuiLinearProgress-bar': {
              backgroundColor: config.color
            }
          }} 
        />
        <Typography variant="body2" color="text.secondary">
          {Math.round(progress)}% - 第 {meeting.current_round} 层讨论
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            🎯 核心议题：{meeting.topic.split('？')[0]}？
          </Typography>
        </Box>
      </Paper>
    );
  };

  // 自由发言模式的活跃度显示
  const renderFreeMode = () => {
    const speakerStats = participants.map(p => ({
      ...p,
      statementCount: statements.filter(s => s.director_id === p.director_id).length
    })).sort((a, b) => b.statementCount - a.statementCount);
    
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {config.icon}
          <Typography variant="h6" sx={{ ml: 1, color: config.color, fontWeight: 600 }}>
            {config.name}
          </Typography>
          <Chip 
            label={config.description} 
            size="small" 
            sx={{ ml: 2, backgroundColor: config.color, color: 'white' }}
          />
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>发言活跃度：</Typography>
        {speakerStats.map((participant, index) => (
          <Box key={participant.director_id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Badge 
              badgeContent={index + 1} 
              color={index === 0 ? "primary" : "default"}
              sx={{ mr: 1 }}
            >
              <Avatar 
                src={participant.director?.avatar_url} 
                sx={{ width: 32, height: 32 }}
              >
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1, ml: 1 }}>
              <Typography variant="body2" fontWeight={index === 0 ? 600 : 400}>
                {participant.director?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {participant.statementCount} 次发言
              </Typography>
            </Box>
            <Chip 
              label={participant.statementCount} 
              size="small" 
              color={index === 0 ? "success" : "default"}
            />
          </Box>
        ))}
      </Paper>
    );
  };

  // 董事会模式的发言顺序显示
  const renderBoardMode = () => {
    // 计算当前轮次中已发言的董事
    const currentRoundStatements = statements.filter(s => 
      s.round_number === meeting.current_round && s.content_type === 'regular'
    );
    
    const spokenDirectorIds = new Set(currentRoundStatements.map(s => s.director_id));
    
    return (
      <Paper sx={{ p: 2, mb: 2, backgroundColor: config.bgColor, border: `1px solid ${config.color}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {config.icon}
          <Typography variant="h6" sx={{ ml: 1, color: config.color, fontWeight: 600 }}>
            {config.name}
          </Typography>
          <Chip 
            label={config.description} 
            size="small" 
            sx={{ ml: 2, backgroundColor: config.color, color: 'white' }}
          />
        </Box>
        
        <Typography variant="subtitle2" gutterBottom>董事会成员发言状态：</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {participants.map((participant, index) => {
            const isCurrent = index === currentSpeakerIndex;
            const isNext = index === nextSpeakerIndex;
            const hasSpoken = spokenDirectorIds.has(participant.director_id);
            
            return (
              <Chip
                key={participant.director_id}
                avatar={
                  <Avatar src={participant.director?.avatar_url} sx={{ width: 24, height: 24 }}>
                    <PersonIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                }
                label={participant.director?.name}
                variant={isCurrent ? "filled" : "outlined"}
                color={isCurrent ? "primary" : isNext ? "secondary" : hasSpoken ? "default" : "warning"}
                sx={{
                  backgroundColor: isCurrent ? config.color : 
                                   isNext ? '#FFA726' : 
                                   hasSpoken ? '#E0E0E0' : '#FFF3E0',
                  opacity: hasSpoken && !isCurrent && !isNext ? 0.7 : 1,
                  border: isNext ? '2px solid #FFA726' : undefined
                }}
              />
            );
          })}
        </Box>
        
        <Typography variant="body2" sx={{ color: config.color, fontWeight: 500 }}>
          第 {meeting.current_round} 轮讨论 | 
          已发言：{currentRoundStatements.length}/{participants.length} | 
          {nextSpeakerIndex !== -1 && !spokenDirectorIds.has(participants[nextSpeakerIndex]?.director_id) && 
            `下一位：${participants[nextSpeakerIndex]?.director?.name}`}
          {meeting.current_round >= 2 && ' | 可进行投票表决'}
        </Typography>
      </Paper>
    );
  };

  // 根据模式渲染不同的界面
  const renderModeSpecificContent = () => {
    switch (discussionMode) {
      case 'round_robin':
        return renderRoundRobinMode();
      case 'debate':
        return renderDebateMode();
      case 'focus':
        return renderFocusMode();
      case 'free':
        return renderFreeMode();
      case 'board':
        return renderBoardMode();
      default:
        return null;
    }
  };

  return renderModeSpecificContent();
};

export default DiscussionModeDisplay;