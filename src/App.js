import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import BoardHall from './pages/BoardHall';
import DirectorManager from './pages/DirectorManager';
import CreateDirector from './pages/CreateDirector';
import DirectorDetails from './pages/DirectorDetails';
import MeetingRoom from './pages/MeetingRoom';
import MeetingHistory from './pages/MeetingHistory';
import CreateMeeting from './pages/CreateMeeting';
import FavoritesPage from './pages/FavoritesPage';

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
          
          {/* 404页面 */}
          <Route path="*" element={<Navigate to="/hall" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;