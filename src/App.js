import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import Navbar from './components/Navbar';

// 首页直接导入，提高FCP；其他页面懒加载
import BoardHall from './pages/BoardHall';

// 懒加载非首页组件 - 添加延迟减少移动端CPU负担
const DirectorManager = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "directors" */ './pages/DirectorManager')), 100);
  })
);
const CreateDirector = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "directors" */ './pages/CreateDirector')), 100);
  })
);
const DirectorDetails = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "directors" */ './pages/DirectorDetails')), 100);
  })
);
const MeetingRoom = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "meetings" */ './pages/MeetingRoom')), 100);
  })
);
const MeetingHistory = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "meetings" */ './pages/MeetingHistory')), 100);
  })
);
const CreateMeeting = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "meetings" */ './pages/CreateMeeting')), 100);
  })
);
const FavoritesPage = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "favorites" */ './pages/FavoritesPage')), 100);
  })
);
const DirectorGroups = React.lazy(() => 
  new Promise(resolve => {
    setTimeout(() => resolve(import(/* webpackChunkName: "groups" */ './pages/DirectorGroups')), 100);
  })
);

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
        <Routes>
          {/* 默认重定向到董事会大厅 */}
          <Route path="/" element={<Navigate to="/hall" replace />} />
          
          {/* 董事会大厅 - 主页(直接渲染，提高FCP) */}
          <Route path="/hall" element={<BoardHall />} />
          
          {/* 其他页面使用懒加载 */}
          <Route path="/directors" element={
            <Suspense fallback={<LoadingComponent />}>
              <DirectorManager />
            </Suspense>
          } />
          <Route path="/directors/create" element={
            <Suspense fallback={<LoadingComponent />}>
              <CreateDirector />
            </Suspense>
          } />
          <Route path="/directors/edit/:id" element={
            <Suspense fallback={<LoadingComponent />}>
              <CreateDirector />
            </Suspense>
          } />
          <Route path="/directors/details/:id" element={
            <Suspense fallback={<LoadingComponent />}>
              <DirectorDetails />
            </Suspense>
          } />
          
          {/* 会议系统 */}
          <Route path="/meetings/create" element={
            <Suspense fallback={<LoadingComponent />}>
              <CreateMeeting />
            </Suspense>
          } />
          <Route path="/meeting/:id" element={
            <Suspense fallback={<LoadingComponent />}>
              <MeetingRoom />
            </Suspense>
          } />
          <Route path="/meetings" element={
            <Suspense fallback={<LoadingComponent />}>
              <MeetingHistory />
            </Suspense>
          } />
          
          {/* 收藏系统 */}
          <Route path="/favorites" element={
            <Suspense fallback={<LoadingComponent />}>
              <FavoritesPage />
            </Suspense>
          } />
          
          {/* 董事组合 */}
          <Route path="/director-groups" element={
            <Suspense fallback={<LoadingComponent />}>
              <DirectorGroups />
            </Suspense>
          } />
          
          {/* 404页面 */}
          <Route path="*" element={<Navigate to="/hall" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;