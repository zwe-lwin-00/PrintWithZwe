import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminAuthProvider } from "@/context/AdminAuthProvider";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminProductFormPage } from "@/pages/admin/AdminProductFormPage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<AdminProductFormPage />} />
            <Route path="products/:id" element={<AdminProductFormPage />} />
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
