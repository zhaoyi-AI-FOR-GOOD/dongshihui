import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Divider,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Lightbulb as InsightIcon,
  TrendingUp as AgreementIcon,
  Warning as DisagreementIcon,
  Star as HighlightIcon,
  ArrowForward as NextStepIcon,
  Assessment as RatingIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const MeetingSummary = ({ meetingId, meetingTitle, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const summaryRef = useRef(null);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings/${meetingId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data.summary);
        setIsGenerated(true);
        toast.success('会议摘要生成成功！');
      } else {
        toast.error(result.error || '生成摘要失败');
      }
    } catch (error) {
      console.error('生成摘要失败:', error);
      toast.error('生成摘要失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;

    const shareText = `【${meetingTitle} - 会议摘要】

核心要点：
${summary.executive_summary}

主要观点：
${summary.key_points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

参与董事亮点：
${summary.participant_highlights.map(h => `• ${h.director}：${h.key_contribution}`).join('\n')}

来自私人董事会系统`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${meetingTitle} - 会议摘要`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('摘要已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!summary || !summaryRef.current) return;
    
    setIsGeneratingImage(true);
    try {
      // 使用Canvas直接绘制摘要，避免字体渲染问题
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置高清画布
      const scale = 2;
      const width = 600;
      const height = Math.max(800, 200 + summary.key_points.length * 30 + summary.participant_highlights.length * 40 + 300);
      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(scale, scale);
      
      // 设置背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // 定义安全的主题颜色
      const safeColor = '#1976d2';
      
      let yPos = 30;
      
      // 绘制标题区域
      ctx.fillStyle = safeColor;
      ctx.fillRect(0, yPos, width, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('会议AI摘要', width / 2, yPos + 20);
      
      ctx.font = '16px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillText(meetingTitle, width / 2, yPos + 45);
      
      yPos += 80;
      
      // 生成时间
      ctx.font = '12px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillStyle = '#999999';
      ctx.textAlign = 'center';
      const timeStr = format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
      ctx.fillText(`生成时间：${timeStr}`, width / 2, yPos);
      
      yPos += 40;
      
      // 执行摘要区域
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const summaryBoxHeight = 80;
      ctx.fillRect(30, yPos, width - 60, summaryBoxHeight);
      ctx.strokeRect(30, yPos, width - 60, summaryBoxHeight);
      
      ctx.fillStyle = safeColor;
      ctx.font = 'bold 16px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('■ 执行摘要', 45, yPos + 20);
      
      // 绘制执行摘要文本（多行处理）
      ctx.fillStyle = '#333333';
      ctx.font = '14px PingFang SC, Microsoft YaHei, sans-serif';
      const summaryLines = wrapText(ctx, summary.executive_summary, width - 100);
      summaryLines.forEach((line, index) => {
        if (index < 2) { // 最多显示2行
          ctx.fillText(line, 45, yPos + 40 + index * 18);
        }
      });
      
      yPos += summaryBoxHeight + 30;
      
      // 关键要点
      ctx.fillStyle = safeColor;
      ctx.font = 'bold 16px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillText('• 关键要点', 30, yPos);
      
      yPos += 25;
      ctx.fillStyle = '#333333';
      ctx.font = '14px PingFang SC, Microsoft YaHei, sans-serif';
      summary.key_points.slice(0, 5).forEach((point, index) => {
        const pointText = `${index + 1}. ${point}`;
        const pointLines = wrapText(ctx, pointText, width - 80);
        pointLines.forEach((line, lineIndex) => {
          ctx.fillText(line, lineIndex === 0 ? 45 : 60, yPos + lineIndex * 18);
        });
        yPos += Math.max(18, pointLines.length * 18);
      });
      
      yPos += 20;
      
      // 董事亮点
      ctx.fillStyle = safeColor;
      ctx.font = 'bold 16px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillText('◆ 董事亮点', 30, yPos);
      
      yPos += 25;
      ctx.fillStyle = '#333333';
      ctx.font = '14px PingFang SC, Microsoft YaHei, sans-serif';
      summary.participant_highlights.slice(0, 4).forEach((highlight) => {
        ctx.fillStyle = safeColor;
        ctx.fillText(`> ${highlight.director}:`, 45, yPos);
        ctx.fillStyle = '#333333';
        const contributionLines = wrapText(ctx, highlight.key_contribution, width - 140);
        contributionLines.forEach((line, lineIndex) => {
          ctx.fillText(line, 120, yPos + lineIndex * 18);
        });
        yPos += Math.max(20, contributionLines.length * 18);
      });
      
      yPos += 30;
      
      // 分隔线
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, yPos);
      ctx.lineTo(width - 30, yPos);
      ctx.stroke();
      
      yPos += 30;
      
      // 品牌信息
      ctx.fillStyle = safeColor;
      ctx.font = 'bold 18px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('私人董事会', width / 2, yPos);
      
      ctx.font = '14px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('dongshihui.xyz 与历史人物共商大事', width / 2, yPos + 25);
      
      ctx.font = '12px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillStyle = '#999999';
      ctx.fillText('本摘要由Claude Sonnet 4 AI自动生成', width / 2, yPos + 45);
      
      return canvas;
    } catch (error) {
      console.error('生成摘要长图失败:', error);
      toast.error('生成摘要长图失败');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 文本换行处理函数 - 改进中文处理
  const wrapText = (context, text, maxWidth) => {
    // 清理文本，移除可能的控制字符
    const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    const chars = Array.from(cleanText); // 使用Array.from正确处理Unicode字符
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const testLine = currentLine + char;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  };

  const handleDownloadSummaryImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `会议摘要-${meetingTitle}-${format(new Date(), 'yyyyMMdd-HHmm')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('摘要长图已下载到本地');
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('下载摘要图片失败:', error);
      toast.error('下载失败');
    }
  };

  const handleShareSummaryImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `会议摘要-${meetingTitle}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `${meetingTitle} - 会议摘要`,
                text: summary.executive_summary.substring(0, 100) + '...',
                files: [file]
              });
            } catch (shareError) {
              await handleDownloadSummaryImage();
            }
          } else {
            await handleDownloadSummaryImage();
          }
        }, 'image/png', 1.0);
      } else {
        await handleDownloadSummaryImage();
      }
    } catch (error) {
      console.error('分享摘要图片失败:', error);
      toast.error('分享失败');
    }
  };

  const handleDownload = async () => {
    if (!summary) return;

    const fullReport = `私人董事会系统 - 会议摘要报告

会议标题：${meetingTitle}
生成时间：${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}

═══════════════════════════════════════

【执行摘要】
${summary.executive_summary}

【关键要点】
${summary.key_points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

【达成共识】
${summary.agreements.map((agreement, index) => `• ${agreement}`).join('\n') || '暂无明确共识'}

【争议分歧】
${summary.disagreements.map((disagreement, index) => `• ${disagreement}`).join('\n') || '暂无重大分歧'}

【深度洞察】
${summary.insights.map((insight, index) => `• ${insight}`).join('\n') || '暂无特殊洞察'}

【参与董事亮点】
${summary.participant_highlights.map(h => `• ${h.director}（${h.key_contribution}）`).join('\n')}

【后续方向】
${summary.next_steps.map((step, index) => `${index + 1}. ${step}`).join('\n') || '暂无后续建议'}

【质量评分】
讨论深度：${summary.rating.depth}/10
争议程度：${summary.rating.controversy}/10
洞察价值：${summary.rating.insight}/10

═══════════════════════════════════════

本报告由私人董事会系统AI自动生成
生成模型：Claude Sonnet 4`;

    try {
      await navigator.clipboard.writeText(fullReport);
      toast.success('完整报告已复制到剪贴板');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            会议AI摘要
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {meetingTitle}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!isGenerated ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {isLoading ? (
              <>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  AI正在分析会议内容，生成智能摘要...
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  生成AI会议摘要
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  AI将分析整场会议的发言内容，提取关键观点、共识分歧、深度洞察等
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateSummary}
                  startIcon={<InsightIcon />}
                >
                  开始生成摘要
                </Button>
              </>
            )}
          </Box>
        ) : summary && (
          <Box 
            ref={summaryRef}
            sx={{ 
              p: 3, 
              backgroundColor: '#ffffff',
              minHeight: '600px'
            }}
          >
            {/* 标题区域 */}
            <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '3px solid #1976d2', pb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                会议AI摘要
              </Typography>
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                {meetingTitle}
              </Typography>
              <Typography variant="body2" sx={{ color: '#999' }}>
                生成时间：{format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </Typography>
            </Box>

            {/* 执行摘要 */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                📋 执行摘要
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#333' }}>
                {summary.executive_summary}
              </Typography>
            </Paper>

            <Grid container spacing={3}>
              {/* 关键要点 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <InsightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    关键要点
                  </Typography>
                  <List dense>
                    {summary.key_points.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${point}`} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* 参与董事亮点 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <HighlightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    董事亮点
                  </Typography>
                  <List dense>
                    {summary.participant_highlights.map((highlight, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={highlight.director}
                          secondary={highlight.key_contribution}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* 共识与分歧 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="success.main">
                    <AgreementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    达成共识
                  </Typography>
                  {summary.agreements.length > 0 ? (
                    <List dense>
                      {summary.agreements.map((agreement, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${agreement}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      暂无明确共识
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="warning.main">
                    <DisagreementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    争议分歧
                  </Typography>
                  {summary.disagreements.length > 0 ? (
                    <List dense>
                      {summary.disagreements.map((disagreement, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${disagreement}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      暂无重大分歧
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* 深度洞察 */}
              {summary.insights.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom color="info.main">
                      💡 深度洞察
                    </Typography>
                    <List dense>
                      {summary.insights.map((insight, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${insight}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}

              {/* 质量评分 */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <RatingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    讨论质量评分
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>讨论深度</Typography>
                        <Rating value={summary.rating.depth / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.depth}/10
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>争议程度</Typography>
                        <Rating value={summary.rating.controversy / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.controversy}/10
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>洞察价值</Typography>
                        <Rating value={summary.rating.insight / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.insight}/10
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* 后续建议 */}
              {summary.next_steps.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <NextStepIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      后续探讨方向
                    </Typography>
                    <List dense>
                      {summary.next_steps.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`${index + 1}. ${step}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}
            </Grid>
            
            {/* 品牌标识区域 */}
            <Box sx={{ 
              textAlign: 'center', 
              mt: 4, 
              pt: 3,
              borderTop: '2px solid #e0e0e0'
            }}>
              <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 1 }}>
                私人董事会
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                dongshihui.xyz 与历史人物共商大事
              </Typography>
              <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                本摘要由Claude Sonnet 4 AI自动生成
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {isGenerated && summary && (
          <>
            <Button 
              startIcon={isGeneratingImage ? <CircularProgress size={16} /> : <ImageIcon />}
              onClick={handleShareSummaryImage}
              disabled={isGeneratingImage}
              variant="contained"
            >
              {isGeneratingImage ? '生成中...' : '分享长图'}
            </Button>
            <Button startIcon={<ShareIcon />} onClick={handleShare}>
              分享文本
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
              复制报告
            </Button>
          </>
        )}
        <Button onClick={onClose}>
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MeetingSummary;