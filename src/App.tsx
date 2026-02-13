import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from './components/MainLayout';
import PointOfSale from './pages/PointOfSale';
import InventoryManager from './pages/InventoryManager';
import Reports from './pages/Reports';
import Accounting from './pages/Accounting';

export default function App() {
  return (
    <>
      <MainLayout>
        <Routes>
          <Route path="/" element={<PointOfSale />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </MainLayout>
      <Toaster position="top-center" richColors theme="light" />
    </>
  );
}