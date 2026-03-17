import React, { use, useEffect, useState } from "react";
import { requestHandler } from "../helper";
import { getAllUsers, userLogout } from "../controller";
import { toast } from "react-toastify";
import { PulseLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { socket, reconnect } = useSocket();
  const [usersList, setUsersList] = useState([]);

  const handleLogout = async () => {
    await requestHandler(
      async () => await userLogout(),
      setLoading,
      (res) => {
        toast.success(res.message);
        localStorage.clear();
        navigate("/");
      },
      (err) => {},
    );
  };

  const GetAllUsers = async () => {
    await requestHandler(
      async () =>
        await getAllUsers({
          page: 1,
          perPage: 10,
          search: "",
        }),
      setLoading,
      (res) => {
        setUsersList(res.data.users);
      },
      (err) => {},
    );
  };

  console.log(usersList, "usersList");

  useEffect(() => {
    GetAllUsers();
  }, []);

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
