import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  IconButton
} from '@mui/material';
import { 
  Home as HomeIcon,
  People as PeopleIcon,
  AccountBalance as MeetingIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      label: '董事会大厅', 
      path: '/hall', 
      icon: <HomeIcon /> 
    },
    { 
      label: '董事管理', 
      path: '/directors', 
      icon: <PeopleIcon /> 
    },
    { 
      label: '会议历史', 
      path: '/meetings', 
      icon: <HistoryIcon /> 
    },
    { 
      label: '我的收藏', 
      path: '/favorites', 
      icon: <FavoriteIcon /> 
    },
    { 
      label: '董事组合', 
      path: '/director-groups', 
      icon: <GroupIcon /> 
    },
  ];

  const isActive = (path) => {
    if (path === '/hall') {
      return location.pathname === '/' || location.pathname === '/hall';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo和标题 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <MeetingIcon sx={{ mr: 2, fontSize: 32 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            私人董事会
          </Typography>
        </Box>

        {/* 导航菜单 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                color: isActive(item.path) ? 'primary.main' : 'inherit',
                backgroundColor: isActive(item.path) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
          
          {/* 快速创建董事按钮 */}
          <IconButton
            color="inherit"
            onClick={() => navigate('/directors/create')}
            sx={{
              ml: 2,
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.3)',
              },
            }}
            title="创建新董事"
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;