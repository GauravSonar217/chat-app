import React, { useState } from "react";
import { requestHandler } from "../helper";
import { userLogout } from "../controller";
import { toast } from "react-toastify";
import { PulseLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await requestHandler(
      async () => await userLogout(),
      setLoading,
      (res) => {
        toast.success(res.message);
        localStorage.removeItem("token");
        navigate("/");
      },
      (err) => {},
    );
  };
  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>
      <button
        className="btn btn-outline-primary m-5"
        onClick={handleLogout}
        disabled={loading}
      >
        {loading ? <PulseLoader size={8} color="#fff" /> : "Logout"}
      </button>
    </div>
  );
};

export default Dashboard;
