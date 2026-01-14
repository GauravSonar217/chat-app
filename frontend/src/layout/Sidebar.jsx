import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => (
  <aside className="sidebar" style={{ width: '220px', background: '#f4f4f4', padding: '1rem 0' }}>
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><NavLink to="/dashboard">Dashboard</NavLink></li>
        <li><NavLink to="/users">User Management</NavLink></li>
        <li><NavLink to="/pods">Pod Management</NavLink></li>
        {/* Add more tabs as needed */}
      </ul>
    </nav>
  </aside>
);

export default Sidebar;
