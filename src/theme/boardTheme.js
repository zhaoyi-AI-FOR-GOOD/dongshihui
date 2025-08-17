import { createTheme } from '@mui/material/styles';

// 私人董事会系统专用色彩体系
const boardColors = {
  // 主品牌色 - 深沉权威的蓝色系
  primary: {
    main: '#1565C0',      // 主蓝色 - 权威感
    light: '#42A5F5',     // 浅蓝色 - 友好感  
    dark: '#0D47A1',      // 深蓝色 - 专业感
    contrastText: '#fff'
  },
  
  // 辅助色 - 温暖的金色系（代表智慧）
  secondary: {
    main: '#F57C00',      // 金橙色 - 智慧感
    light: '#FFB74D',     // 浅金色 - 启发感
    dark: '#E65100',      // 深橙色 - 热情感
    contrastText: '#fff'
  },

  // 功能色彩
  success: {
    main: '#2E7D32',      // 深绿 - 成功/共识
    light: '#81C784',     // 浅绿 - 积极
  },
  
  warning: {
    main: '#F57C00',      // 橙色 - 争议/辩论
    light: '#FFB74D',     // 浅橙 - 提醒
  },
  
  error: {
    main: '#D32F2F',      // 红色 - 错误/结束
    light: '#F8BBD9',     // 浅红 - 轻微警告
  },

  info: {
    main: '#1976D2',      // 信息蓝
    light: '#64B5F6',     // 浅信息蓝
  },

  // 专用色彩
  board: {
    userQuestion: '#E3F2FD',    // 用户提问背景
    userQuestionText: '#1565C0', // 用户提问文字
    directorSpeech: '#FAFAFA',   // 董事发言背景
    highlight: '#FFF3E0',        // 重点内容背景
    wisdom: '#F3E5F5',           // 智慧洞察背景
    debate: '#FFF8E1',           // 争议辩论背景
  },

  // 灰色系
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5', 
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// 字体层次系统
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont', 
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans SC"',
    'sans-serif'
  ].join(','),
  
  // 专用字体大小
  h4: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.02em'
  },
  
  h5: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  },
  
  h6: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  
  subtitle1: {
    fontSize: '1.1rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  
  subtitle2: {
    fontSize: '0.95rem',
    fontWeight: 500,
    lineHeight: 1.4
  },
  
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
    letterSpacing: '0.01em'
  },
  
  body2: {
    fontSize: '0.9rem',
    lineHeight: 1.5
  },
  
  caption: {
    fontSize: '0.8rem',
    lineHeight: 1.4,
    color: boardColors.grey[600]
  },

  // 专用样式
  directorSpeech: {
    fontSize: '1.1rem',
    lineHeight: 1.7,
    fontWeight: 400,
    letterSpacing: '0.02em'
  },
  
  userQuestion: {
    fontSize: '1rem',
    lineHeight: 1.6,
    fontWeight: 500,
    letterSpacing: '0.01em'
  },
  
  timestamp: {
    fontSize: '0.85rem',
    fontWeight: 500,
    color: boardColors.grey[700]
  }
};

// 创建主题
export const boardTheme = createTheme({
  palette: {
    primary: boardColors.primary,
    secondary: boardColors.secondary,
    success: boardColors.success,
    warning: boardColors.warning,
    error: boardColors.error,
    info: boardColors.info,
    grey: boardColors.grey,
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF'
    },
    text: {
      primary: boardColors.grey[900],
      secondary: boardColors.grey[700]
    }
  },
  
  typography,
  
  // 自定义颜色扩展
  customColors: boardColors.board,
  
  // 组件样式覆盖
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
          }
        }
      }
    },
    
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500
        }
      }
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        },
        contained: {
          boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(25,118,210,0.4)'
          }
        }
      }
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12
        }
      }
    }
  }
});

export default boardTheme;