import AppRoutes from './routes';
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate} from "react-router-dom"; // Get current route
import { displayNameUser } from "./services/Api";
import { Menu, MenuItem} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getUserData, removeUserData } from "./services/Storage"
import './App.css';

function App() {
  const [username, setUsername] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // Controls the dropdown menu's state in profile
  const location = useLocation(); // Get current page path
  const navigate = useNavigate();

  useEffect(() => {
    setAnchorEl(null); 
    const isAuth = getUserData();
    if(isAuth){
      displayNameUser().then((response)=>{
        const storedUser = response.data.users[0].displayName || null;
        if (storedUser) {
            setUsername(storedUser);
        }
      })
    }
  }, [location.pathname]); // Will run on every route change
  
   // Open and Close Menu Handlers
   const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Logout Handler
  const logoutUser = ()=>{
    removeUserData(); // Remove token from local storage 
    navigate('/login');   
   }

  return (
    <>
    <header>
      <img id="logo" src="/SynaLogo1.png" alt="logo"/>
      <h2>VSM WebLink</h2>
      
      {username && !["/login", "/register"].includes(location.pathname) &&
      (<div className="profile-container" onClick={handleMenuOpen}>
       <AccountCircleIcon fontSize="large" className="profile-icon"/>
       <span className="user-info">{username}</span>
       <KeyboardArrowDownIcon style={{ marginLeft: '-14px' }} fontSize="small" /> 
       </div>
      )}
      {/* Dropdown Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={logoutUser}>Logout</MenuItem>
      </Menu>
    </header>

    <AppRoutes/>

    <footer>
      <p>&copy; 2025 Custom Website. All rights reserved by the company.</p>
    </footer>
  </>
  );
}

export default App;
