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
  Fab
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
  Settings as SettingsIcon
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

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [questions, setQuestions] = useState([]);

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
    () => meetingAPI.start(id),
    {
      onSuccess: () => {
        toast.success('会议已开始！');
        refetch();
        // 会议开始后，自动生成第一个发言
        setTimeout(() => {
          if (!isGenerating) {
            handleGenerateNext();
          }
        }, 1000);
      },
      onError: (err) => {
        toast.error('开始会议失败: ' + err.message);
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
        toast.success(`${directorName} 的发言已生成`);
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
    toast.success('提问已提交，董事们正在思考回应...');
  };

  // 获取会议问题列表
  useEffect(() => {
    if (id && meeting) {
      const fetchQuestions = async () => {
        try {
          const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/meetings/${id}/questions`);
          const result = await response.json();
          if (result.success) {
            setQuestions(result.data);
          }
        } catch (error) {
          console.error('获取问题列表失败:', error);
        }
      };
      fetchQuestions();
    }
  }, [id, meeting]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [statements]);

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
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* 会议头部信息 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/hall')}
              sx={{ mr: 2 }}
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
                <Typography variant="body2" color="text.secondary">
                  第 {meeting.current_round}/{meeting.max_rounds} 轮
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statements.length} 条发言
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* 会议控制按钮 */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {meeting.status === 'preparing' && (
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isLoading}
                color="success"
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
                >
                  暂停
                </Button>
                <Button
                  variant="contained"
                  startIcon={<NextIcon />}
                  onClick={handleGenerateNext}
                  disabled={isGenerating}
                  color="primary"
                >
                  {isGenerating ? '生成中...' : '下一个发言'}
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
              >
                继续会议
              </Button>
            )}
            
            {!['finished'].includes(meeting.status) && (
              <Button
                variant="outlined"
                startIcon={<StopIcon />}
                onClick={() => setShowFinishDialog(true)}
                color="error"
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
      <Grid container spacing={3}>
        {/* 左侧：发言记录 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                会议讨论记录
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
                statements.map((statement, index) => {
                  const director = statement.Director;
                  const isNewRound = index === 0 || statement.round_number !== statements[index - 1]?.round_number;
                  
                  return (
                    <React.Fragment key={statement.id}>
                      {/* 轮次分隔符 */}
                      {isNewRound && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <Divider>
                            <Chip 
                              label={`第 ${statement.round_number} 轮`} 
                              size="small" 
                              color="primary" 
                            />
                          </Divider>
                        </Box>
                      )}
                      
                      {/* 发言内容 */}
                      <Card sx={{ mb: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar 
                              src={director?.avatar_url}
                              sx={{ width: 32, height: 32, mr: 2 }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2">
                                {director?.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {director?.title}
                                {statement.created_at && (
                                  <> · {format(new Date(statement.created_at), 'HH:mm', { locale: zhCN })}</>
                                )}
                              </Typography>
                            </Box>
                            {statement.content_type === 'opening' && (
                              <Chip label="开场" size="small" color="success" />
                            )}
                            {statement.content_type === 'closing' && (
                              <Chip label="结语" size="small" color="error" />
                            )}
                            <FavoriteButton
                              statementId={statement.id}
                              favoriteType="statement"
                            />
                          </Box>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {statement.content}
                          </Typography>
                        </CardContent>
                      </Card>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </Box>
          </Paper>
        </Grid>

        {/* 右侧：会议信息和互动 */}
        <Grid item xs={12} md={4}>
          {/* 用户提问区域 */}
          {['discussing', 'debating', 'paused'].includes(meeting.status) && (
            <QuestionBox 
              meetingId={id} 
              onQuestionSubmitted={handleQuestionSubmitted}
            />
          )}
          
          {/* 问题和回应列表 */}
          {questions.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, maxHeight: '40vh', overflow: 'auto' }}>
              <QuestionResponseList questions={questions} />
            </Paper>
          )}

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

          {/* 生成进度 */}
          {isGenerating && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
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
            <Alert severity="info">
              点击"下一个发言"让董事们继续讨论
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
    </Container>
  );
};

export default MeetingRoom;