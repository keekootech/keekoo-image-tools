import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ToolPage from './pages/ToolPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tools/image-compressor" replace />} />
        <Route path="/tools" element={<Navigate to="/tools/image-compressor" replace />} />
        <Route path="/tools/:slug" element={<ToolPage />} />
        <Route path="*" element={<Navigate to="/tools/image-compressor" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
