import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  Divider,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { directorAPI } from '../services/api';

const DirectorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // 获取董事详情
  const { data: directorResponse, isLoading, error } = useQuery(
    ['director', id],
    () => directorAPI.getById(id),
    {
      onError: (err) => {
        toast.error('获取董事详情失败: ' + err.message);
        navigate('/directors');
      }
    }
  );

  const director = directorResponse?.data?.data;

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6">加载中...</Typography>
      </Container>
    );
  }

  if (error || !director) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          加载董事详情失败，请稍后重试。
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面头部 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/directors')}
            sx={{ mr: 2 }}
          >
            返回
          </Button>
          <Typography variant="h4" component="h1">
            董事详情
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/directors/edit/${director.id}`)}
        >
          编辑董事
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* 左侧：基本信息 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={director.avatar_url}
                  sx={{ width: 80, height: 80, mr: 2 }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {director.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {director.title}
                  </Typography>
                  {director.era && (
                    <Typography variant="body2" color="text.secondary">
                      {director.era}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* 基本信息 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  基本信息
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    创建时间: {format(new Date(director.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </Typography>
                </Box>
                {director.updatedAt !== director.createdAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2" color="text.secondary">
                      更新时间: {format(new Date(director.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* 活动统计 */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  活动统计
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">发言次数</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {director.total_statements}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">参与会议</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {director.total_meetings}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧：详细信息 */}
        <Grid item xs={12} md={8}>
          {/* 人设特征 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                人物特征
              </Typography>
              
              {director.personality_traits && director.personality_traits.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    性格特征
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {director.personality_traits.map((trait, index) => (
                      <Chip key={index} label={trait} variant="outlined" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {director.core_beliefs && director.core_beliefs.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    核心信念
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {director.core_beliefs.map((belief, index) => (
                      <Chip key={index} label={belief} color="primary" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {director.expertise_areas && director.expertise_areas.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    专业领域
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {director.expertise_areas.map((area, index) => (
                      <Chip key={index} label={area} color="secondary" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              {director.speaking_style && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    说话风格
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {director.speaking_style}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 人设提示词 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PsychologyIcon sx={{ mr: 1 }} />
                人设提示词
              </Typography>
              
              {director.system_prompt ? (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    maxHeight: 400,
                    overflow: 'auto'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    component="pre" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: '#333333',
                      margin: 0,
                      fontWeight: 400
                    }}
                  >
                    {director.system_prompt}
                  </Typography>
                </Paper>
              ) : (
                <Alert severity="info">
                  暂无人设提示词
                </Alert>
              )}

              {/* AI 分析信息 */}
              {director.metadata && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    AI分析: {director.metadata.ai_generated ? '已启用' : '未启用'}
                    {director.metadata.confidence_score && 
                      ` (置信度: ${Math.round(director.metadata.confidence_score * 100)}%)`
                    }
                    {director.metadata.tokens_used && 
                      ` | 使用Token: ${director.metadata.tokens_used}`
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DirectorDetails;