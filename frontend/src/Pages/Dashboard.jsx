import React, { useContext, useEffect } from "react";
import { userContext } from "../App";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Profile from "../components/UserDashboard";

const Dashboard = () => {
  const { user, setUser } = useContext(userContext);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast("Unauthorized ! Please login ...");
      navigate("/login");
    }
    if (user == null) {
      let dcrypted = jwtDecode(token);
      setUser({ userId: dcrypted?.userId, role: dcrypted?.userId });
    }
  }, [token]);
  return (
    <div className="bg-gray-100">
      <h1>User Dashboard Page </h1>
      <Profile />
    </div>
  );
};

export default Dashboard;
