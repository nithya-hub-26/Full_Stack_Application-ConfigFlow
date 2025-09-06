import React, { useState, useEffect, useCallback } from "react";
import { Box, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getLogs } from "../../services/Api";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "../../SnackbarContext";
import "./Logs.css"

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(true);
  const openSnackBar = useSnackbar();
  const filename = "scripting.log";


  const fetchLogs = useCallback(async () => {
    try{
      setReloading(true);
      const response = await getLogs(filename);
      const data = response.data
      console.log("fetching logs")
      if (data.status === "success") {
        setLogs(data.response);
      } else if(data.status === "failure"){
        openSnackBar(data.errorMessage, 'Close', true)
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs", error);
      openSnackBar("Error fetching logs", 'Close', true)
      setLogs([]);
    } finally {
      setLoading(false);
      setReloading(false);
    }
  }, [openSnackBar]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  
  return (
    <div>
        {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                   <CircularProgress />  {/* Material-UI Spinner */}
                </Box>
               ) : ( 
              <div className="log-container">
               <div className="log-filename">
               Filename: <input type="text" value={filename} disabled className="filename-field"/>
               <IconButton className="refresh-button" disabled={reloading} onClick={fetchLogs}>
                {reloading ? <CircularProgress size={20} /> : <RefreshIcon/>}
               </IconButton>
               </div>

               <Box className="log-box">
               <pre>
                {logs.length ? logs.split("\n").map((line, index) => {
                let color = "black";
                if (line.includes("ERROR")) color = "red";
                else if (line.includes("WARNING")) color = "orange";
                else if (line.includes("INFO")) color = "green";

                return (
                  <span key={index} style={{ color }}>
                    {line}
                    <br />
                  </span>
                );
              })
            : "  No logs available"}
              </pre>
              </Box>
              </div>
        )}
    </div>  
)};

export default Logs;           