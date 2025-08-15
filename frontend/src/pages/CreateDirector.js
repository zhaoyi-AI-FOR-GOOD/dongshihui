import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { directorAPI } from '../services/api';

const CreateDirector = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    era: '',
    avatar_url: '',
    system_prompt: '',
    personality_traits: [],
    core_beliefs: [],
    speaking_style: '',
    expertise_areas: [],
    is_active: true
  });

  // UI状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [useSmartMode, setUseSmartMode] = useState(true);

  // 获取董事信息（编辑模式）
  const { data: directorData, isLoading } = useQuery(
    ['director', id],
    () => directorAPI.getById(id),
    {
      enabled: isEditing,
      onSuccess: (response) => {
        const director = response.data;
        setFormData({
          name: director.name || '',
          title: director.title || '',
          era: director.era || '',
          avatar_url: director.avatar_url || '',
          system_prompt: director.system_prompt || '',
          personality_traits: director.personality_traits || [],
          core_beliefs: director.core_beliefs || [],
          speaking_style: director.speaking_style || '',
          expertise_areas: director.expertise_areas || [],
          is_active: director.is_active
        });
      },
      onError: (err) => {
        toast.error('获取董事信息失败: ' + err.message);
        navigate('/directors');
      }
    }
  );

  // 保存董事
  const saveMutation = useMutation(
    (data) => isEditing ? directorAPI.update(id, data) : directorAPI.create(data),
    {
      onSuccess: () => {
        toast.success(isEditing ? '董事更新成功' : '董事创建成功');
        queryClient.invalidateQueries('directors');
        queryClient.invalidateQueries('activeDirectors');
        navigate('/directors');
      },
      onError: (err) => {
        toast.error('保存失败: ' + err.message);
      }
    }
  );

  // 智能创建董事
  const smartCreateMutation = useMutation(
    (systemPrompt) => directorAPI.createFromPrompt(systemPrompt, formData.avatar_url),
    {
      onSuccess: (response) => {
        toast.success('智能创建成功！');
        queryClient.invalidateQueries('directors');
        queryClient.invalidateQueries('activeDirectors');
        navigate('/directors');
      },
      onError: (err) => {
        toast.error('智能创建失败: ' + err.message);
      }
    }
  );

  // AI解析提示词
  const analyzePrompt = async () => {
    if (!formData.system_prompt.trim()) {
      toast.error('请先输入人设提示词');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await directorAPI.parsePrompt(formData.system_prompt);
      const result = response.data.data;
      
      setAnalysisResult(result);
      
      // 自动填充解析结果
      if (result.parsed_info) {
        setFormData(prev => ({
          ...prev,
          name: result.parsed_info.name !== '未知历史人物' ? result.parsed_info.name : prev.name,
          title: result.parsed_info.title || prev.title,
          era: result.parsed_info.era || prev.era,
          personality_traits: result.parsed_info.personality_traits || prev.personality_traits,
          core_beliefs: result.parsed_info.core_beliefs || prev.core_beliefs,
          speaking_style: result.parsed_info.speaking_style || prev.speaking_style,
          expertise_areas: result.parsed_info.expertise_areas || prev.expertise_areas
        }));
      }

      toast.success(result.is_ai_generated ? 'AI解析完成！' : '基础解析完成');
    } catch (error) {
      toast.error('解析失败: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.title.trim() || !formData.system_prompt.trim()) {
      toast.error('请填写必要字段：姓名、身份、人设提示词');
      return;
    }

    if (useSmartMode && !isEditing) {
      // 智能创建模式
      smartCreateMutation.mutate(formData.system_prompt);
    } else {
      // 普通保存模式
      saveMutation.mutate(formData);
    }
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理标签数组输入
  const handleArrayInput = (field, value) => {
    const array = value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean);
    handleInputChange(field, array);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载中...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/directors')}
          sx={{ mr: 2 }}
        >
          返回
        </Button>
        
        <Typography variant="h4" component="h1">
          {isEditing ? '编辑董事' : '创建董事'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* 左侧：人设提示词输入 */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon />
                    人设提示词
                  </Typography>
                  
                  {!isEditing && (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={useSmartMode}
                          onChange={(e) => setUseSmartMode(e.target.checked)}
                        />
                      }
                      label="智能创建模式"
                    />
                  )}
                </Box>

                <TextField
                  multiline
                  rows={12}
                  fullWidth
                  placeholder="请输入历史人物的人设描述，例如：&#10;&#10;你是16世纪的宗教改革领袖约翰·加尔文。你是一位严谨的神学家，提出了预定论思想，认为上帝已经预先确定了每个人的救赎命运。你说话严谨、逻辑性强，经常引用《圣经》来支持你的观点..."
                  value={formData.system_prompt}
                  onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                  variant="outlined"
                  required
                />

                {!isEditing && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={analyzePrompt}
                      disabled={isAnalyzing || !formData.system_prompt.trim()}
                    >
                      {isAnalyzing ? '解析中...' : 'AI解析'}
                    </Button>

                    {useSmartMode && (
                      <Alert severity="info" sx={{ flex: 1 }}>
                        智能创建模式：系统将自动解析提示词并创建董事，无需手动填写其他信息
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* AI解析结果 */}
            {analysisResult && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI解析结果
                  </Typography>
                  
                  <Alert 
                    severity={analysisResult.is_ai_generated ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    {analysisResult.is_ai_generated 
                      ? `AI解析成功 (置信度: ${Math.round(analysisResult.confidence_score * 100)}%)`
                      : analysisResult.warning || '使用基础关键词匹配'
                    }
                  </Alert>

                  {analysisResult.parsed_info && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">姓名</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {analysisResult.parsed_info.name}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">身份</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {analysisResult.parsed_info.title}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="subtitle2">核心观点</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {analysisResult.parsed_info.core_beliefs?.map((belief, index) => (
                            <Chip key={index} label={belief} size="small" />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* 右侧：董事信息 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon />
                  董事信息
                </Typography>

                {/* 基本信息 */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="姓名 *"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    sx={{ mb: 2 }}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="身份/头衔 *"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    sx={{ mb: 2 }}
                    required
                  />
                  
                  <TextField
                    fullWidth
                    label="历史时代"
                    value={formData.era}
                    onChange={(e) => handleInputChange('era', e.target.value)}
                    placeholder="如：20世纪 (1879-1955)"
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label="头像URL"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                    placeholder="可选的头像图片链接"
                  />
                </Box>

                {/* 详细信息折叠面板 */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>详细特征</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      fullWidth
                      label="性格特征"
                      multiline
                      rows={2}
                      value={formData.personality_traits.join(', ')}
                      onChange={(e) => handleArrayInput('personality_traits', e.target.value)}
                      placeholder="如：好奇心强, 独立思考, 富有想象力"
                      helperText="用逗号分隔多个特征"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="核心信念"
                      multiline
                      rows={2}
                      value={formData.core_beliefs.join(', ')}
                      onChange={(e) => handleArrayInput('core_beliefs', e.target.value)}
                      placeholder="如：科学理性, 追求真理, 质疑权威"
                      helperText="用逗号分隔多个信念"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="说话风格"
                      value={formData.speaking_style}
                      onChange={(e) => handleInputChange('speaking_style', e.target.value)}
                      placeholder="如：幽默风趣、善于用比喻"
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="专业领域"
                      multiline
                      rows={2}
                      value={formData.expertise_areas.join(', ')}
                      onChange={(e) => handleArrayInput('expertise_areas', e.target.value)}
                      placeholder="如：理论物理, 数学, 哲学"
                      helperText="用逗号分隔多个领域"
                    />
                  </AccordionDetails>
                </Accordion>

                {/* 董事预览 */}
                {(formData.name || formData.title) && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      董事预览
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={formData.avatar_url}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {formData.name || '未设置姓名'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.title || '未设置身份'}
                        </Typography>
                        {formData.era && (
                          <Typography variant="caption" color="text.secondary">
                            {formData.era}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 底部操作栏 */}
        <Paper sx={{ p: 3, mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/directors')}
          >
            取消
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {!isEditing && !useSmartMode && (
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => setUseSmartMode(true)}
              >
                切换智能模式
              </Button>
            )}
            
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saveMutation.isLoading || smartCreateMutation.isLoading}
            >
              {saveMutation.isLoading || smartCreateMutation.isLoading
                ? '保存中...'
                : isEditing
                  ? '更新董事'
                  : useSmartMode
                    ? '智能创建'
                    : '创建董事'
              }
            </Button>
          </Box>
        </Paper>
      </form>
    </Container>
  );
};

export default CreateDirector;