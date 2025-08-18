import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Share as ShareIcon,
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';

const QuoteCard = ({ statementId, onClose }) => {
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef(null);

  React.useEffect(() => {
    if (statementId) {
      fetchCardData();
    }
  }, [statementId]);

  const fetchCardData = async () => {
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/statements/${statementId}/card`);
      const result = await response.json();
      
      if (result.success) {
        setCardData(result.data);
      } else {
        toast.error('获取卡片数据失败');
      }
    } catch (error) {
      console.error('获取卡片数据失败:', error);
      toast.error('获取卡片数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!cardData) return;

    const shareText = `【${cardData.director.name}】${cardData.director.title}\n\n"${cardData.analysis.highlight_quote || cardData.content}"\n\n来自私人董事会系统 - ${cardData.meeting.title}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.director.name}的金句`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('内容已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  const handleDownload = async () => {
    if (!cardData || !cardRef.current) return;

    try {
      // 使用html2canvas库来截图（需要安装）
      // 这里提供一个简化版本，复制文本内容
      const cardText = `${cardData.director.name}（${cardData.director.title}）

"${cardData.content}"

来自会议：${cardData.meeting.title}
话题：${cardData.meeting.topic}
发言时间：${format(new Date(cardData.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}

关键词：${cardData.analysis.keywords.join(', ')}
分类：${cardData.analysis.category}

—— 私人董事会系统`;

      await navigator.clipboard.writeText(cardText);
      toast.success('卡片内容已复制到剪贴板');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            正在生成金句卡片...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cardData) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="error">
            卡片生成失败
          </Typography>
          <Button onClick={onClose} sx={{ mt: 2 }}>
            关闭
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>

          <Paper 
            ref={cardRef}
            sx={{ 
              p: 4,
              background: `linear-gradient(135deg, ${cardData.analysis.theme_color}22 0%, ${cardData.analysis.theme_color}11 100%)`,
              border: `2px solid ${cardData.analysis.theme_color}`,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 装饰性背景 */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: `radial-gradient(circle, ${cardData.analysis.theme_color}15 0%, transparent 70%)`,
                borderRadius: '50%'
              }}
            />

            {/* 分类标签 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Chip 
                label={cardData.analysis.category} 
                sx={{ 
                  backgroundColor: cardData.analysis.theme_color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                第{cardData.round_number}轮发言
              </Typography>
            </Box>

            {/* 董事信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={cardData.director.avatar_url}
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mr: 2,
                  border: `3px solid ${cardData.analysis.theme_color}`
                }}
              >
                {cardData.director.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {cardData.director.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {cardData.director.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cardData.director.era}
                </Typography>
              </Box>
            </Box>

            {/* 核心金句 */}
            <Box 
              sx={{ 
                textAlign: 'center',
                mb: 3,
                p: 3,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  color: cardData.analysis.theme_color,
                  fontWeight: 500,
                  position: 'relative',
                  '&::before': {
                    content: '"',
                    fontSize: '3em',
                    position: 'absolute',
                    left: -20,
                    top: -20,
                    opacity: 0.3,
                    color: cardData.analysis.theme_color
                  },
                  '&::after': {
                    content: '"',
                    fontSize: '3em',
                    position: 'absolute',
                    right: -20,
                    bottom: -30,
                    opacity: 0.3,
                    color: cardData.analysis.theme_color
                  }
                }}
              >
                {cardData.analysis.highlight_quote || cardData.content}
              </Typography>
            </Box>

            {/* 关键词 */}
            {cardData.analysis.keywords.length > 0 && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                {cardData.analysis.keywords.map((keyword, index) => (
                  <Chip 
                    key={index}
                    label={keyword} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      mr: 0.5, 
                      mb: 0.5,
                      borderColor: cardData.analysis.theme_color,
                      color: cardData.analysis.theme_color
                    }}
                  />
                ))}
              </Box>
            )}

            {/* 会议信息 */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                来自会议：{cardData.meeting.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(cardData.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
              </Typography>
            </Box>

            {/* 品牌标识 */}
            <Box sx={{ textAlign: 'center', borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                私人董事会系统
              </Typography>
            </Box>
          </Paper>

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, pb: 2 }}>
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ backgroundColor: cardData.analysis.theme_color }}
            >
              分享金句
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ borderColor: cardData.analysis.theme_color, color: cardData.analysis.theme_color }}
            >
              复制内容
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteCard;