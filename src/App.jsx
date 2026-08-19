import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: "10px",
                background: "#1e293b",
                color: "#fff",
                fontSize: "13px",
              },
            }}
          />
          <AppRoutes />
        </DashboardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}