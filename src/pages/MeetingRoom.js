import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
  Alert,
  Fab,
  useMediaQuery,
  useTheme,
  Collapse,
  SwipeableDrawer
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  SkipNext as NextIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Forum as ForumIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  Summarize as SummarizeIcon,
  Download as DownloadIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  VerticalAlignBottom as ScrollDownIcon,
  VerticalAlignTop as ScrollUpIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { meetingAPI } from '../services/api';
import QuestionBox from '../components/QuestionBox';
import QuestionResponseList from '../components/QuestionResponseList';
import FavoriteButton from '../components/FavoriteButton';
import QuoteCard from '../components/QuoteCard';
import MeetingSummary from '../components/MeetingSummary';
import MeetingExport from '../components/MeetingExport';
import DiscussionModeDisplay from '../components/DiscussionModeDisplay';
import StatementDisplay from '../components/StatementDisplay';

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showQuoteCard, setShowQuoteCard] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [rebuttalTarget, setRebuttalTarget] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [previousStatementsCount, setPreviousStatementsCount] = useState(0);

  // 获取会议详情
  const { data: meetingResponse, isLoading, error, refetch } = useQuery(
    ['meeting', id],
    () => meetingAPI.getById(id),
    {
      enabled: !!id,
      refetchInterval: (data) => {
        // 如果会议正在进行中，每3秒刷新一次
        const meeting = data?.data?.data;
        return meeting && ['discussing', 'debating'].includes(meeting.status) ? 3000 : false;
      },
      onError: (err) => {
        toast.error('获取会议详情失败: ' + err.message);
        navigate('/hall');
      }
    }
  );

  const meeting = meetingResponse?.data?.data;
  const statements = meeting?.statements || [];
  const participants = meeting?.participants || [];

  // 开始会议
  const startMutation = useMutation(
    async () => {
      // 在启动前检查会议状态
      if (meeting?.status && meeting.status !== 'preparing') {
        throw new Error(`会议当前状态为"${meeting.status}"，无法启动`);
      }
      return await meetingAPI.start(id);
    },
    {
      onSuccess: async () => {
        toast.success('会议已开始！');
        try {
          // 先刷新会议状态，确保状态更新
          await refetch();
          
          // 给用户一个选择，而不是自动生成
          toast.success('会议已开始！您可以点击"下一个发言"开始讨论', { 
            duration: 4000 
          });
          
          // 可选：延迟更长时间后自动生成，但不阻塞开始会议的成功
          // setTimeout(() => {
          //   if (!isGenerating) {
          //     handleGenerateNext();
          //   }
          // }, 3000);
          
        } catch (error) {
          console.warn('刷新会议状态失败，但会议已成功开始:', error);
        }
      },
      onError: (err) => {
        const errorMsg = err.message;
        if (errorMsg.includes('Meeting cannot be started') || errorMsg.includes('already started') || errorMsg.includes('已开始')) {
          toast.warning('会议已经开始了！正在刷新页面状态...');
          // 刷新会议状态以同步最新状态
          refetch();
        } else {
          toast.error('开始会议失败: ' + errorMsg);
        }
      }
    }
  );

  // 暂停会议
  const pauseMutation = useMutation(
    () => meetingAPI.pause(id),
    {
      onSuccess: () => {
        toast.success('会议已暂停');
        refetch();
      },
      onError: (err) => {
        toast.error('暂停会议失败: ' + err.message);
      }
    }
  );

  // 恢复会议
  const resumeMutation = useMutation(
    () => meetingAPI.resume(id),
    {
      onSuccess: () => {
        toast.success('会议已恢复');
        refetch();
      },
      onError: (err) => {
        toast.error('恢复会议失败: ' + err.message);
      }
    }
  );

  // 结束会议
  const finishMutation = useMutation(
    () => meetingAPI.finish(id),
    {
      onSuccess: () => {
        toast.success('会议已结束');
        setShowFinishDialog(false);
        refetch();
      },
      onError: (err) => {
        toast.error('结束会议失败: ' + err.message);
      }
    }
  );

  // 生成下一个发言
  const generateMutation = useMutation(
    () => meetingAPI.generateNextStatement(id),
    {
      onSuccess: (response) => {
        const directorName = response.data?.data?.director?.name;
        toast.success(`${directorName} 的发言已生成${!autoScroll ? '，滚动查看最新内容' : ''}`);
        refetch();
        setIsGenerating(false);
      },
      onError: (err) => {
        toast.error('生成发言失败: ' + err.message);
        setIsGenerating(false);
      }
    }
  );

  // 处理生成下一个发言
  const handleGenerateNext = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    generateMutation.mutate();
  };

  // 处理用户提问
  const handleQuestionSubmitted = (questionData) => {
    setQuestions(prev => [questionData, ...prev]);
    
    // 根据提问类型显示不同的提示
    const isAllDirectorQuestion = questionData.question_scope === 'all';
    if (isAllDirectorQuestion) {
      toast.success(`提问已提交，${participants.length}位董事正在依次回应...`);
      
      // 全员提问：定期刷新以显示每位董事的发言
      let refreshCount = 0;
      const maxRefreshes = participants.length + 1; // 多一次最终刷新
      
      const intervalRefresh = setInterval(() => {
        refreshCount++;
        refetch();
        fetchQuestions(); // 同时刷新问题列表状态
        
        if (refreshCount >= maxRefreshes) {
          clearInterval(intervalRefresh);
        }
      }, 3500); // 每3.5秒刷新一次
      
    } else {
      toast.success('提问已提交，指定董事正在回应...');
      setTimeout(() => {
        refetch();
        fetchQuestions(); // 同时刷新问题列表状态
      }, 3500);
    }
  };

  // 获取问题列表的函数
  const fetchQuestions = async () => {
    if (!id) return;
    try {
      // 使用统一API服务避免CORS问题
      const response = await meetingAPI.getById(id);
      if (response.data?.success) {
        // 从会议详情中获取问题信息，或者需要后端提供专门的questions API
        setQuestions(response.data.data?.questions || []);
      }
    } catch (error) {
      console.error('获取问题列表失败:', error);
    }
  };

  // 获取会议问题列表
  useEffect(() => {
    if (id && meeting) {
      fetchQuestions();
    }
  }, [id, meeting]);

  // 处理分享金句
  const handleShareQuote = (statementId) => {
    setSelectedStatementId(statementId);
    setShowQuoteCard(true);
  };

  // 处理反驳（辩论模式专用）
  const handleRebuttal = (statement) => {
    setRebuttalTarget(statement);
    // 在辩论模式下，立即生成反驳发言
    if (meeting.discussion_mode === 'debate') {
      handleGenerateNext();
    }
  };

  // 计算当前和下一个发言者（轮流发言模式）
  const getCurrentSpeakerIndex = () => {
    if (meeting?.discussion_mode !== 'round_robin') return -1;
    
    const currentRoundStatements = statements.filter(s => 
      s.round_number === meeting.current_round && s.content_type === 'regular'
    );
    return currentRoundStatements.length % participants.length;
  };

  const getNextSpeakerIndex = () => {
    if (meeting?.discussion_mode !== 'round_robin') return -1;
    
    const current = getCurrentSpeakerIndex();
    return (current + 1) % participants.length;
  };

  // 智能滚动控制 - 只滚动会议讨论记录容器
  useEffect(() => {
    // 检测是否有新发言
    const currentCount = statements.length;
    const hasNewStatement = currentCount > previousStatementsCount;
    
    if (hasNewStatement && autoScroll && messagesContainerRef.current) {
      // 滚动会议讨论记录容器到底部
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
      
      setPreviousStatementsCount(currentCount);
    }
  }, [statements, autoScroll, previousStatementsCount]);

  // 获取状态显示
  const getStatusInfo = (status) => {
    const statusMap = {
      'preparing': { label: '准备中', color: 'default' },
      'discussing': { label: '讨论中', color: 'success' },
      'debating': { label: '辩论中', color: 'warning' },
      'paused': { label: '已暂停', color: 'info' },
      'finished': { label: '已结束', color: 'error' }
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const statusInfo = getStatusInfo(meeting?.status);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">加载会议信息中...</Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Paper>
      </Container>
    );
  }

  if (error || !meeting) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            加载会议失败
          </Typography>
          <Button variant="contained" onClick={() => navigate('/hall')}>
            返回大厅
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 1 : 2 }}>
      {/* 会议头部信息 */}
      <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: isMobile ? 2 : 0,
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/hall')}
              sx={{ mr: 2 }}
              size={isMobile ? 'medium' : 'medium'}
            >
              返回大厅
            </Button>
            <Box>
              <Typography variant="h5" component="h1">
                {meeting.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Chip 
                  label={statusInfo.label} 
                  color={statusInfo.color} 
                  size="small" 
                />
                
                {/* 讨论模式标识 */}
                <Chip 
                  label={
                    meeting.discussion_mode === 'round_robin' ? '轮流发言' :
                    meeting.discussion_mode === 'debate' ? '辩论模式' :
                    meeting.discussion_mode === 'focus' ? '聚焦讨论' :
                    meeting.discussion_mode === 'free' ? '自由发言' : '未知模式'
                  }
                  variant="outlined"
                  size="small"
                  sx={{
                    color: meeting.discussion_mode === 'debate' ? '#D32F2F' :
                           meeting.discussion_mode === 'focus' ? '#7B1FA2' :
                           meeting.discussion_mode === 'free' ? '#388E3C' : '#1565C0',
                    borderColor: meeting.discussion_mode === 'debate' ? '#D32F2F' :
                                meeting.discussion_mode === 'focus' ? '#7B1FA2' :
                                meeting.discussion_mode === 'free' ? '#388E3C' : '#1565C0'
                  }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {meeting.discussion_mode === 'debate' ? '第' : meeting.discussion_mode === 'focus' ? '第' : '第'} {meeting.current_round}/{meeting.max_rounds} {meeting.discussion_mode === 'debate' ? '回合' : meeting.discussion_mode === 'focus' ? '层' : '轮'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statements.length} 条发言
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* 会议控制按钮 */}
          <Box 
            data-meeting-controls
            sx={{ 
              display: 'flex', 
              gap: isMobile ? 1 : 1,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: isMobile ? 'center' : 'flex-end'
            }}
          >
            {meeting.status === 'preparing' && (
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isLoading}
                color="success"
                size={isMobile ? 'large' : 'medium'}
                sx={{ minHeight: isMobile ? 48 : 'auto' }}
              >
                开始会议
              </Button>
            )}
            
            {['discussing', 'debating'].includes(meeting.status) && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isLoading}
                  size={isMobile ? 'large' : 'medium'}
                  sx={{ minHeight: isMobile ? 48 : 'auto' }}
                >
                  暂停
                </Button>
                <Button
                  variant="contained"
                  startIcon={<NextIcon />}
                  onClick={handleGenerateNext}
                  disabled={isGenerating}
                  color="primary"
                  size={isMobile ? 'large' : 'medium'}
                  sx={{ minHeight: isMobile ? 48 : 'auto' }}
                >
                  {isGenerating ? '生成中...' : 
                   meeting.discussion_mode === 'debate' ? '继续辩论' :
                   meeting.discussion_mode === 'focus' ? '深入讨论' :
                   meeting.discussion_mode === 'free' ? '自由发言' : '下一个发言'}
                </Button>
              </>
            )}
            
            {meeting.status === 'paused' && (
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isLoading}
                color="success"
                size={isMobile ? 'large' : 'medium'}
                sx={{ minHeight: isMobile ? 48 : 'auto' }}
              >
                继续会议
              </Button>
            )}
            
            {/* 手机端将次要按钮放到抽屉里 */}
            {!isMobile && statements.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SummarizeIcon />}
                  onClick={() => setShowSummary(true)}
                  color="info"
                >
                  生成摘要
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setShowExport(true)}
                  color="secondary"
                >
                  导出全文
                </Button>
              </>
            )}
            
            {/* 手机端的菜单按钮 */}
            {isMobile && statements.length > 0 && (
              <IconButton
                onClick={() => setMobileDrawerOpen(true)}
                size="large"
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {!['finished'].includes(meeting.status) && (
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={() => setShowFinishDialog(true)}
                color="error"
                size={isMobile ? 'large' : 'medium'}
                sx={{ minHeight: isMobile ? 48 : 'auto' }}
              >
                结束会议
              </Button>
            )}
          </Box>
        </Box>
        
        {/* 会议话题 */}
        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            讨论话题：
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {meeting.topic}
          </Typography>
        </Box>

        {/* 参与董事 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {participants.map((participant) => (
            <Chip
              key={participant.id}
              avatar={
                <Avatar 
                  src={participant.director?.avatar_url}
                  sx={{ width: 24, height: 24 }}
                >
                  <PersonIcon sx={{ fontSize: 14 }} />
                </Avatar>
              }
              label={`${participant.director?.name} (${participant.statement_count || 0})`}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      </Paper>

      {/* 会议内容区域 */}
      <Grid container spacing={isMobile ? 2 : 3}>
        {/* 发言记录区域 */}
        <Grid item xs={12} md={8} order={isMobile ? 2 : 1}>
          <Paper sx={{ 
            height: isMobile ? '50vh' : '60vh', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Box sx={{ 
              p: isMobile ? 1.5 : 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'}>
                会议讨论记录
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* 滚动控制按钮 */}
                <IconButton
                  size="small"
                  onClick={() => setAutoScroll(!autoScroll)}
                  title={autoScroll ? "关闭自动滚动" : "开启自动滚动"}
                  sx={{ 
                    color: autoScroll ? 'primary.main' : 'text.secondary',
                    backgroundColor: autoScroll ? 'primary.light' : 'transparent'
                  }}
                >
                  <ScrollDownIcon sx={{ fontSize: 18 }} />
                </IconButton>
                
                {/* 手动滚到底部按钮 */}
                <IconButton
                  size="small"
                  onClick={() => {
                    const container = messagesContainerRef.current;
                    if (container) {
                      container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }}
                  title="滚动到最新发言"
                >
                  <ScrollUpIcon sx={{ fontSize: 18 }} />
                </IconButton>
                
                {/* 手机端在这里显示会议进度 */}
                {isMobile && (
                  <Chip 
                    label={`${meeting.current_round}/${meeting.max_rounds}轮`}
                    size="small"
                    color="primary"
                  />
                )}
              </Box>
            </Box>
            
            <Box 
              ref={messagesContainerRef}
              sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: isMobile ? 1.5 : 2 
              }}
            >
              {statements.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {meeting.status === 'preparing' 
                      ? '会议尚未开始，点击"开始会议"开始讨论'
                      : '暂无发言记录'
                    }
                  </Typography>
                </Box>
              ) : (
                <>
                  {statements.map((statement, index) => {
                    const isNewRound = index === 0 || statement.round_number !== statements[index - 1]?.round_number;
                    
                    return (
                      <React.Fragment key={statement.id}>
                        {/* 轮次分隔符 - 根据模式显示不同样式 */}
                        {isNewRound && meeting.discussion_mode && (
                          <Box sx={{ textAlign: 'center', my: 3 }}>
                            <Divider>
                              <Chip 
                                label={meeting.discussion_mode === 'debate' ? `第${statement.round_number}回合` : 
                                       meeting.discussion_mode === 'focus' ? `第${statement.round_number}层讨论` :
                                       meeting.discussion_mode === 'free' ? `阶段${statement.round_number}` :
                                       `第${statement.round_number}轮`} 
                                size="small" 
                                color="primary"
                                sx={{ 
                                  backgroundColor: meeting.discussion_mode === 'debate' ? '#D32F2F' :
                                                  meeting.discussion_mode === 'focus' ? '#7B1FA2' :
                                                  meeting.discussion_mode === 'free' ? '#388E3C' : '#1565C0',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </Divider>
                          </Box>
                        )}
                        
                        {/* 使用新的发言显示组件 */}
                        <StatementDisplay
                          statement={statement}
                          index={index}
                          statements={statements}
                          meeting={meeting}
                          onShareQuote={handleShareQuote}
                          onRebuttal={meeting.discussion_mode === 'debate' ? handleRebuttal : null}
                        />
                      </React.Fragment>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </Box>
          </Paper>
        </Grid>

        {/* 会议信息和互动区域 */}
        <Grid item xs={12} md={4} order={isMobile ? 1 : 2}>
          {/* 讨论模式显示 - 手机端简化 */}
          {!isMobile && (
            <DiscussionModeDisplay
              meeting={meeting}
              participants={participants}
              statements={statements}
              currentSpeakerIndex={getCurrentSpeakerIndex()}
              nextSpeakerIndex={getNextSpeakerIndex()}
            />
          )}
          
          {/* 手机端简化的模式显示 */}
          {isMobile && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#E3F2FD' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  {meeting.discussion_mode === 'round_robin' ? '轮流发言模式' :
                   meeting.discussion_mode === 'debate' ? '辩论模式' :
                   meeting.discussion_mode === 'focus' ? '聚焦讨论模式' :
                   meeting.discussion_mode === 'free' ? '自由发言模式' : '讨论模式'}
                </Typography>
                <Chip 
                  label={`${statements.length}发言`} 
                  size="small" 
                  color="primary"
                />
              </Box>
            </Paper>
          )}
          
          {/* 用户提问区域 */}
          {['discussing', 'debating', 'paused'].includes(meeting.status) && (
            <QuestionBox 
              meetingId={id} 
              onQuestionSubmitted={handleQuestionSubmitted}
              participants={participants}
            />
          )}
          
          {/* 问题和回应列表 - 手机端简化 */}
          {questions.length > 0 && (
            <Paper sx={{ 
              p: isMobile ? 1.5 : 2, 
              mb: isMobile ? 2 : 3, 
              maxHeight: isMobile ? '30vh' : '40vh', 
              overflow: 'auto' 
            }}>
              <QuestionResponseList questions={questions} />
            </Paper>
          )}

          {/* 会议统计 - 电脑端显示详细，手机端简化 */}
          {!isMobile && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                会议统计
              </Typography>
              <Box sx={{ space: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">进行轮数</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {meeting.current_round}/{meeting.max_rounds}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">总发言数</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {statements.length}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">参与人数</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {participants.length}
                  </Typography>
                </Box>
                {meeting.started_at && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">开始时间</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {format(new Date(meeting.started_at), 'HH:mm', { locale: zhCN })}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* 生成进度 */}
          {isGenerating && (
            <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                AI 生成中...
              </Typography>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                正在让董事们思考并生成回应，请稍候...
              </Typography>
            </Paper>
          )}

          {/* 提示信息 */}
          {meeting.status === 'discussing' && !isGenerating && (
            <Alert severity="info" sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
              {meeting.discussion_mode === 'round_robin' && `下一位发言：${participants[getNextSpeakerIndex()]?.director?.name || '等待确定'}`}
              {meeting.discussion_mode === 'debate' && '点击"继续辩论"让对方进行反驳'}
              {meeting.discussion_mode === 'focus' && '点击"深入讨论"进入下一层分析'}
              {meeting.discussion_mode === 'free' && '点击"自由发言"让董事们随机互动'}
              {!meeting.discussion_mode && '点击"下一个发言"让董事们继续讨论'}
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* 结束会议确认对话框 */}
      <Dialog open={showFinishDialog} onClose={() => setShowFinishDialog(false)}>
        <DialogTitle>确认结束会议</DialogTitle>
        <DialogContent>
          <Typography>
            确定要结束这次会议吗？结束后将生成会议摘要，且无法继续添加发言。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFinishDialog(false)}>
            取消
          </Button>
          <Button 
            color="error" 
            onClick={() => finishMutation.mutate()}
            disabled={finishMutation.isLoading}
          >
            {finishMutation.isLoading ? '结束中...' : '确认结束'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 金句卡片对话框 */}
      {showQuoteCard && selectedStatementId && (
        <QuoteCard 
          statementId={selectedStatementId}
          onClose={() => {
            setShowQuoteCard(false);
            setSelectedStatementId(null);
          }}
        />
      )}

      {/* 会议摘要对话框 */}
      {showSummary && (
        <MeetingSummary 
          meetingId={id}
          meetingTitle={meeting.title}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* 全文导出对话框 */}
      {showExport && (
        <MeetingExport 
          meetingId={id}
          meetingTitle={meeting.title}
          statementCount={statements.length}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* 手机端抽屉式菜单 */}
      <SwipeableDrawer
        anchor="bottom"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpen={() => setMobileDrawerOpen(true)}
        disableSwipeToOpen={false}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">会议操作</Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SummarizeIcon />}
                onClick={() => {
                  setShowSummary(true);
                  setMobileDrawerOpen(false);
                }}
                color="info"
                size="large"
                sx={{ minHeight: 56 }}
              >
                生成摘要
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => {
                  setShowExport(true);
                  setMobileDrawerOpen(false);
                }}
                color="secondary"
                size="large"
                sx={{ minHeight: 56 }}
              >
                导出全文
              </Button>
            </Grid>
          </Grid>
          
          {/* 会议统计 - 手机端在抽屉里显示 */}
          <Paper sx={{ p: 2, mt: 3, backgroundColor: '#F5F5F5' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              会议统计
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {meeting.current_round}
                  </Typography>
                  <Typography variant="caption">
                    当前轮次
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {statements.length}
                  </Typography>
                  <Typography variant="caption">
                    总发言数
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {participants.length}
                  </Typography>
                  <Typography variant="caption">
                    参与董事
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </SwipeableDrawer>

      {/* 浮动的快速操作按钮 */}
      {statements.length > 3 && (
        <Fab
          color="primary"
          size="medium"
          onClick={() => {
            const controlsElement = document.querySelector('[data-meeting-controls]');
            controlsElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 80 : 24,
            right: 24,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          title="回到控制区域"
        >
          <ScrollUpIcon />
        </Fab>
      )}
    </Container>
  );
};

export default MeetingRoom;