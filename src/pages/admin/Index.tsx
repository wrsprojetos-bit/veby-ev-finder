import { Routes, Route } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "./Dashboard";
import ScreenManager from "./ScreenManager";

export default function AdminIndex() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="screens" element={<ScreenManager />} />
        <Route path="listings" element={<div>Gestão de Anúncios (em desenvolvimento)</div>} />
        <Route path="users" element={<div>Gestão de Usuários (em desenvolvimento)</div>} />
        <Route path="reports" element={<div>Denúncias (em desenvolvimento)</div>} />
        <Route path="notifications" element={<div>Notificações (em desenvolvimento)</div>} />
        <Route path="logs" element={<div>Logs (em desenvolvimento)</div>} />
      </Routes>
    </AdminLayout>
  );
}
