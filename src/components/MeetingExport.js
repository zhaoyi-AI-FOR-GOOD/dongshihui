import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Description as DocumentIcon,
  Code as MarkdownIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const MeetingExport = ({ meetingId, meetingTitle, statementCount, onClose }) => {
  const [exportType, setExportType] = useState('text');
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const exportOptions = [
    {
      value: 'text',
      label: '纯文本格式',
      description: '适合复制粘贴和简单分享',
      icon: <DocumentIcon />
    },
    {
      value: 'markdown',
      label: 'Markdown格式',
      description: '适合技术文档和GitHub等平台',
      icon: <MarkdownIcon />
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings/${meetingId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          export_type: exportType,
          include_analysis: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setExportResult(result.data);
        toast.success('会议内容导出成功！');
      } else {
        toast.error(result.error || '导出失败');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!exportResult) return;

    try {
      const blob = new Blob([exportResult.content], { 
        type: exportType === 'markdown' ? 'text/markdown' : 'text/plain' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${meetingTitle}-会议记录.${exportType === 'markdown' ? 'md' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('文件下载成功！');
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!exportResult) return;

    try {
      await navigator.clipboard.writeText(exportResult.content);
      toast.success('内容已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleShare = async () => {
    if (!exportResult) return;

    const shareText = `【${meetingTitle}】会议完整记录\n\n包含${exportResult.meeting_info.statement_count}条发言，${exportResult.meeting_info.participant_count}位董事参与\n\n来自私人董事会系统`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${meetingTitle} - 会议记录`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      await handleCopyToClipboard();
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        导出会议完整记录
      </DialogTitle>
      
      <DialogContent>
        {!exportResult ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              将导出完整的会议讨论记录，包括所有董事发言和用户提问环节
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                会议信息
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={`${statementCount} 条发言`} size="small" />
                <Chip label={meetingTitle} size="small" variant="outlined" />
              </Box>
            </Box>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">选择导出格式</FormLabel>
              <RadioGroup
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                {exportOptions.map((option) => (
                  <Paper key={option.value} sx={{ p: 2, mb: 1 }}>
                    <FormControlLabel
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {option.icon}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>

            {isExporting && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  正在生成导出内容...
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              会议记录导出成功！包含 {exportResult.meeting_info.statement_count} 条发言记录
            </Alert>

            <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                导出统计信息
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    发言数
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#333' }}>
                    {exportResult.meeting_info.statement_count}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    董事数
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#333' }}>
                    {exportResult.meeting_info.participant_count}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    提问数
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#333' }}>
                    {exportResult.meeting_info.question_count}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>
                    格式
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#333' }}>
                    {exportType.toUpperCase()}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="body2" sx={{ mb: 2, color: '#555', fontWeight: 500 }}>
              内容预览（前200字符）：
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0', mb: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.85em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#333',
                  lineHeight: 1.5
                }}
              >
                {exportResult.content.substring(0, 200)}...
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {!exportResult ? (
          <>
            <Button onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={handleExport} 
              variant="contained"
              disabled={isExporting}
              startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            >
              {isExporting ? '导出中...' : '开始导出'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleCopyToClipboard} startIcon={<ShareIcon />}>
              复制内容
            </Button>
            <Button onClick={handleShare} startIcon={<ShareIcon />}>
              分享
            </Button>
            <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
              下载文件
            </Button>
            <Button onClick={onClose}>
              关闭
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MeetingExport;