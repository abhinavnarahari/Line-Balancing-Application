import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./features/auth/AuthContext";
import { GlobalErrorToaster } from "./components/common/GlobalErrorToaster";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <GlobalErrorToaster />
    </AuthProvider>
  );
}

export default App;
