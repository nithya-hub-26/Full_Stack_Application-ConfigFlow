import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { displayNameUser } from "../../services/Api";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuIcon from "@mui/icons-material/Menu"; // Hamburger icon
import DashboardTable from "./DashboardTable";
import PoolsTable from "../Pool/Pools";
import Logs from "../Logs/Logs";
import LineupForm from "../Lineups/Lineup";
import HelpTable from "../Help/Help";
import "./Dashboard.css";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [username, setUsername] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Toggle sidebar
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {  // For usage of async/await using a function and calling it immediately
      try {
        console.log("Fetching user...");
        const response = await displayNameUser();
        const storedUser = response.data.users[0].displayName;

        if (storedUser) {
          setUsername(storedUser);
        } else {
          navigate("/login"); // Redirect if not logged in
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

   // Define tab names and their corresponding MUI icons
  const tabs = [
    { name: "Dashboard", icon: <DashboardIcon /> },
    { name: "Pools", icon: <InventoryIcon /> },
    { name: "Lineups", icon: <ListAltIcon /> },
    { name: "Logs", icon: <AssignmentIcon /> },
    { name: "Help", icon: <HelpOutlineIcon /> },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="menu-toggle" onClick={() => setSidebarOpen(false)}>
          <MenuIcon />
        </div>
        <ul>
          {tabs.map((tab) => (
            <li
              key={tab.name}
              className={activeTab === tab.name ? "active" : ""}
              onClick={() => setActiveTab(tab.name)}
            >
              {tab.icon}
              <span className="tab-name">{tab.name}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Menu button always visible */}
      {!sidebarOpen && (
        <div className="menu-toggle fixed" onClick={() => setSidebarOpen(true)}>
          <MenuIcon />
        </div>
)}

      {/* Main Content */}
      <main className="content">
        <header>
          <h2>{activeTab}</h2>
          <div className="username">{activeTab === "Dashboard" ? `Welcome, ${username.split(" ")[0]}` : ""}</div>
        </header>

        <section>
          {activeTab === "Dashboard" && <DashboardTable />}
          {activeTab === "Lineups" && <LineupForm/>}
          {activeTab === "Pools" && <PoolsTable />}
          {activeTab === "Logs" && <Logs />}
          {activeTab === "Help" && <HelpTable/>}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
