import React, { useEffect, useState } from "react";
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress"; // Material-UI Spinner
import { getDashboards } from "../../services/Api";
import Box from "@mui/material/Box";
import { useSnackbar } from "../../SnackbarContext";
import "./DashboardTable.css"

const DashboardTable = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const openSnackBar = useSnackbar();
  
  useEffect(() => {
    console.log("fetchin dashboards....")
    setLoading(true)
    const fetchDashboards = async () => {
        try {
          const response = await getDashboards();
          const data = JSON.parse(response.data);
          // Ensure response contains dashboards inside dashboardPreferences
          if (data.status === "success") {
            setDashboards(data.response.dashboardPreferences.dashboards);
          } else if(data.status === "failure"){
            openSnackBar(data.errorMessage, 'Close', true)
          }else {
            setDashboards([]); // Default to empty if not found
          }
        } catch (error) {
          console.error("Error fetching dashboards", error);
          openSnackBar("Error fetching dashboards", 'Close', true)
          setDashboards([]); // Handle errors by resetting the state
        } finally {
            setLoading(false);  // Hide loading after fetching
          }
      };
    fetchDashboards();
  }, [openSnackBar]);


  const handleRowClick = (url) => {
    window.open(url, "_blank"); // Opens in a new tab
  };

  return (
    loading? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
           <CircularProgress />  {/* Material-UI Spinner */}
        </Box>
    ):(
    <TableContainer className="table-container">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell><b>NAME</b></TableCell>
          <TableCell><b>URL</b></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {dashboards.map((dashboard, index) => (
          <TableRow key={index} className="dashboard-row">
            <TableCell>{dashboard.name}</TableCell>
            <TableCell onClick={() => handleRowClick(dashboard.url)}>{dashboard.url}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
  )
 );
};
    

export default DashboardTable;
