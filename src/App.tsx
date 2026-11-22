import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "./pages/Register/Register";
import Profile from "./pages/Profile/Profile";
import Collection from "./pages/Collection/Collection";
import Recommendation from "./pages/Recommendation/Recommendation";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import { protectedPages } from "./protectedPages";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <ProtectedLayout />
                </ProtectedRoute>
              }
            >
              <Route path={protectedPages.profile.path} element={<Profile />} />
              <Route
                path={protectedPages.collection.path}
                element={<Collection />}
              />
              <Route
                path={protectedPages.recommendation.path}
                element={<Recommendation />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
