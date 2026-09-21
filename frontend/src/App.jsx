import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import TopHeader from "./components/TopHeader";
import Login from "./pages/Login";
import NewSale from "./pages/NewSale";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Discount from "./pages/Discount";
import Debts from "./pages/Debts";
import InvoicePreview from "./pages/InvoicePreview";

function AppLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/facture/");

  if (!isAuthenticated || bare) return <div className="min-h-screen bg-gray-50">{children}</div>;

  return (
    <div className="min-h-screen bg-gray-50 sm:pr-20">
      <Sidebar />
      <TopHeader />
      <div className="pb-20 sm:pb-0">{children}</div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NewSale />
                </ProtectedRoute>
              }
            />
            <Route
              path="/historique"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parametres"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reduction"
              element={
                <ProtectedRoute>
                  <Discount />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dettes"
              element={
                <ProtectedRoute>
                  <Debts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/facture/:kind/:id"
              element={
                <ProtectedRoute>
                  <InvoicePreview />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
