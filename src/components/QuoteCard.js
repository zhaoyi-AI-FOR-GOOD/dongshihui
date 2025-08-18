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
  Close as CloseIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const QuoteCard = ({ statementId, onClose }) => {
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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
        console.error('卡片API返回错误:', result.error);
        // 如果API失败，创建一个默认的cardData以便测试长图功能
        setCardData({
          id: statementId,
          content: "这是一个测试金句，用于演示长图分享功能。",
          director: {
            name: "测试董事",
            title: "AI测试专家",
            avatar_url: null,
            era: "2024年"
          },
          meeting: {
            title: "测试会议",
            topic: "测试长图分享功能"
          },
          analysis: {
            keywords: ["测试", "长图", "分享"],
            theme_color: "#1976d2",
            category: "测试",
            highlight_quote: "这是一个测试金句"
          },
          created_at: new Date().toISOString(),
          round_number: 1
        });
        toast.error('获取卡片数据失败，使用测试数据');
      }
    } catch (error) {
      console.error('获取卡片数据失败:', error);
      // 网络错误时也使用测试数据
      setCardData({
        id: statementId,
        content: "网络连接失败，这是测试数据用于演示长图分享功能。",
        director: {
          name: "测试董事", 
          title: "系统测试员",
          avatar_url: null,
          era: "现代"
        },
        meeting: {
          title: "测试会议",
          topic: "网络错误处理测试"
        },
        analysis: {
          keywords: ["网络", "错误", "测试"],
          theme_color: "#f44336", 
          category: "错误",
          highlight_quote: "网络连接失败时的处理"
        },
        created_at: new Date().toISOString(),
        round_number: 1
      });
      toast.error('网络连接失败，使用测试数据');
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

  const handleGenerateImage = async () => {
    if (!cardData) return;
    
    setIsGeneratingImage(true);
    try {
      // 完全抛弃html2canvas，使用纯Canvas API手绘
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置高清画布
      const scale = 2;
      const width = 480;
      const height = 600;
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(scale, scale);
      
      // 背景渐变
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(25, 118, 210, 0.1)');
      gradient.addColorStop(1, 'rgba(25, 118, 210, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 边框
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);
      
      // 装饰圆形
      ctx.fillStyle = 'rgba(25, 118, 210, 0.05)';
      ctx.beginPath();
      ctx.arc(width - 50, 50, 80, 0, 2 * Math.PI);
      ctx.fill();
      
      let yPos = 40;
      
      // 分类标签
      ctx.fillStyle = '#1976d2';
      ctx.fillRect(30, yPos, 100, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      const cleanCategory = (cardData.analysis.category || '发言').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '');
      ctx.fillText(cleanCategory, 80, yPos + 18);
      
      // 轮次信息
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'right';
      ctx.fillText(`第${cardData.round_number}轮发言`, width - 30, yPos + 18);
      
      yPos += 50;
      
      // 头像圆形
      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.arc(70, yPos + 30, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // 头像文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.textAlign = 'center';
      const initial = cardData.director.name ? cardData.director.name[0] : 'A';
      ctx.fillText(initial, 70, yPos + 38);
      
      // 董事信息
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial, sans-serif';
      const cleanName = (cardData.director.name || '匿名董事').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '');
      ctx.fillText(cleanName, 110, yPos + 20);
      
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      const cleanTitle = (cardData.director.title || '董事会成员').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '');
      ctx.fillText(cleanTitle, 110, yPos + 42);
      
      ctx.font = '14px Arial, sans-serif';
      const cleanEra = (cardData.director.era || '现代').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '');
      ctx.fillText(cleanEra, 110, yPos + 60);
      
      yPos += 100;
      
      // 白色金句背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const quoteHeight = 120;
      ctx.fillRect(30, yPos, width - 60, quoteHeight);
      
      // 金句文本（严格清理）
      const quoteText = (cardData.analysis.highlight_quote || cardData.content || '精彩发言')
        .replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a\u3000-\u303f\uff00-\uffef\s.,!?;:()"""''，。！？；：（）]/g, '')
        .trim();
      
      ctx.fillStyle = '#1976d2';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      
      // 手动文本换行
      const maxLineWidth = width - 120;
      const lines = [];
      let currentLine = '';
      
      for (let char of quoteText) {
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      const lineHeight = 24;
      const startY = yPos + (quoteHeight - lines.length * lineHeight) / 2 + 18;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight);
      });
      
      yPos += quoteHeight + 30;
      
      // 会议信息
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      const cleanMeeting = (cardData.meeting.title || '未知会议').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a\s]/g, '');
      ctx.fillText(`来自会议：${cleanMeeting}`, width / 2, yPos);
      
      const dateStr = format(new Date(cardData.created_at), 'yyyy年MM月dd日', { locale: zhCN });
      ctx.fillText(dateStr, width / 2, yPos + 20);
      
      yPos += 50;
      
      // 分隔线
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, yPos);
      ctx.lineTo(width - 30, yPos);
      ctx.stroke();
      
      yPos += 20;
      
      // 品牌信息
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.fillStyle = '#1976d2';
      ctx.fillText('私人董事会', width / 2, yPos);
      
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('dongshihui.xyz 与历史人物共商大事', width / 2, yPos + 20);
      
      return canvas;
    } catch (error) {
      console.error('生成图片失败:', error);
      toast.error('生成图片失败');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      // 将canvas转换为blob并下载
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `金句卡片-${cardData.director.name}-${format(new Date(cardData.created_at), 'yyyyMMdd-HHmm')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('长图已下载到本地');
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('下载图片失败:', error);
      toast.error('下载失败');
    }
  };

  const handleShareImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      // 尝试使用Web Share API分享图片
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `金句卡片-${cardData.director.name}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `${cardData.director.name}的金句`,
                text: `"${cardData.analysis.highlight_quote || cardData.content}" —— ${cardData.director.name}`,
                files: [file]
              });
            } catch (shareError) {
              // 如果分享失败，退回到下载
              await handleDownloadImage();
            }
          } else {
            await handleDownloadImage();
          }
        }, 'image/png', 1.0);
      } else {
        // 不支持Web Share API，直接下载
        await handleDownloadImage();
      }
    } catch (error) {
      console.error('分享图片失败:', error);
      toast.error('分享失败');
    }
  };

  const handleDownload = async () => {
    if (!cardData || !cardRef.current) return;

    try {
      // 提供文本版本的备选方案
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
      toast.error('复制失败');
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
              overflow: 'hidden',
              width: 480, // 固定宽度，适合分享
              minHeight: 600, // 最小高度
              margin: '0 auto'
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

            {/* 品牌标识和网站信息 */}
            <Box sx={{ 
              textAlign: 'center', 
              borderTop: 1, 
              borderColor: 'divider', 
              pt: 2,
              mt: 2
            }}>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>
                私人董事会
              </Typography>
              <Typography variant="caption" color="text.secondary">
                dongshihui.xyz 与历史人物共商大事
              </Typography>
            </Box>
          </Paper>

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3, pb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={isGeneratingImage ? <CircularProgress size={16} color="inherit" /> : <ImageIcon />}
              onClick={handleShareImage}
              disabled={isGeneratingImage}
              sx={{ 
                backgroundColor: cardData.analysis.theme_color,
                minWidth: 120
              }}
            >
              {isGeneratingImage ? '生成中...' : '分享长图'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ 
                borderColor: cardData.analysis.theme_color, 
                color: cardData.analysis.theme_color,
                minWidth: 100
              }}
            >
              分享文本
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ 
                borderColor: cardData.analysis.theme_color, 
                color: cardData.analysis.theme_color,
                minWidth: 100
              }}
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