import React from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

const AdminLayout = ({ children }) => (
  <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, padding: '1rem' }}>{children}</main>
    </div>
  </div>
);

export default AdminLayout;
