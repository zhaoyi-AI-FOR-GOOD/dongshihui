import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import Navbar from './components/Navbar';

// Chunk加载失败重试函数
const retryImport = (importFn, retryCount = 3) => {
  return new Promise((resolve, reject) => {
    const attemptImport = (count) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          if (count > 0) {
            console.warn(`Chunk加载失败，还剩 ${count} 次重试...`, error);
            setTimeout(() => attemptImport(count - 1), 1000);
          } else {
            console.error('Chunk加载彻底失败:', error);
            reject(error);
          }
        });
    };
    attemptImport(retryCount);
  });
};

// 首页直接导入，提高FCP；其他页面懒加载
import BoardHall from './pages/BoardHall';

// 懒加载非首页组件 - 添加重试机制和延迟减少移动端CPU负担
const DirectorManager = React.lazy(() => retryImport(() => import(/* webpackChunkName: "directors" */ './pages/DirectorManager')));
const CreateDirector = React.lazy(() => retryImport(() => import(/* webpackChunkName: "directors" */ './pages/CreateDirector')));
const DirectorDetails = React.lazy(() => retryImport(() => import(/* webpackChunkName: "directors" */ './pages/DirectorDetails')));
const MeetingRoom = React.lazy(() => retryImport(() => import(/* webpackChunkName: "meetings" */ './pages/MeetingRoom')));
const MeetingHistory = React.lazy(() => retryImport(() => import(/* webpackChunkName: "meetings" */ './pages/MeetingHistory')));
const CreateMeeting = React.lazy(() => retryImport(() => import(/* webpackChunkName: "meetings" */ './pages/CreateMeeting')));
const FavoritesPage = React.lazy(() => retryImport(() => import(/* webpackChunkName: "favorites" */ './pages/FavoritesPage')));
const DirectorGroups = React.lazy(() => retryImport(() => import(/* webpackChunkName: "groups" */ './pages/DirectorGroups')));

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

// 错误边界组件
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chunk加载错误:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
    // 刷新页面重新加载
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              页面加载失败
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              网络连接不稳定或资源暂时不可用，请重试或刷新页面。
            </Typography>
            <Button variant="contained" onClick={this.handleRetry} sx={{ mr: 1 }}>
              重新加载
            </Button>
            <Button variant="outlined" onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ChunkErrorBoundary>
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
          
          {/* 其他页面使用懒加载 - 每个页面都包装错误边界 */}
          <Route path="/directors" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <DirectorManager />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          <Route path="/directors/create" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <CreateDirector />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          <Route path="/directors/edit/:id" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <CreateDirector />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          <Route path="/directors/details/:id" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <DirectorDetails />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          
          {/* 会议系统 */}
          <Route path="/meetings/create" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <CreateMeeting />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          <Route path="/meeting/:id" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <MeetingRoom />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          <Route path="/meetings" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <MeetingHistory />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          
          {/* 收藏系统 */}
          <Route path="/favorites" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <FavoritesPage />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          
          {/* 董事组合 */}
          <Route path="/director-groups" element={
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingComponent />}>
                <DirectorGroups />
              </Suspense>
            </ChunkErrorBoundary>
          } />
          
          {/* 404页面 */}
          <Route path="*" element={<Navigate to="/hall" replace />} />
        </Routes>
        </Box>
      </Box>
    </ChunkErrorBoundary>
  );
}

export default App;