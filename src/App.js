import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import Navbar from './components/Navbar';

// 懒加载页面组件，减少初始bundle大小
const BoardHall = React.lazy(() => import('./pages/BoardHall'));
const DirectorManager = React.lazy(() => import('./pages/DirectorManager'));
const CreateDirector = React.lazy(() => import('./pages/CreateDirector'));
const DirectorDetails = React.lazy(() => import('./pages/DirectorDetails'));
const MeetingRoom = React.lazy(() => import('./pages/MeetingRoom'));
const MeetingHistory = React.lazy(() => import('./pages/MeetingHistory'));
const CreateMeeting = React.lazy(() => import('./pages/CreateMeeting'));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage'));
const DirectorGroups = React.lazy(() => import('./pages/DirectorGroups'));

// 加载中组件
const LoadingComponent = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '50vh',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      页面加载中...
    </Typography>
  </Box>
);

function App() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: 'background.default',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Navbar />
      
      <Box component="main" sx={{ flex: 1, pt: 2 }}>
        <Suspense fallback={<LoadingComponent />}>
          <Routes>
            {/* 默认重定向到董事会大厅 */}
            <Route path="/" element={<Navigate to="/hall" replace />} />
            
            {/* 董事会大厅 - 主页 */}
            <Route path="/hall" element={<BoardHall />} />
            
            {/* 董事管理 */}
            <Route path="/directors" element={<DirectorManager />} />
            <Route path="/directors/create" element={<CreateDirector />} />
            <Route path="/directors/edit/:id" element={<CreateDirector />} />
            <Route path="/directors/details/:id" element={<DirectorDetails />} />
            
            {/* 会议系统 */}
            <Route path="/meetings/create" element={<CreateMeeting />} />
            <Route path="/meeting/:id" element={<MeetingRoom />} />
            <Route path="/meetings" element={<MeetingHistory />} />
            
            {/* 收藏系统 */}
            <Route path="/favorites" element={<FavoritesPage />} />
            
            {/* 董事组合 */}
            <Route path="/director-groups" element={<DirectorGroups />} />
            
            {/* 404页面 */}
            <Route path="*" element={<Navigate to="/hall" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}

export default App;