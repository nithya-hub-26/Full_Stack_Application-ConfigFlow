import React, { useState, useEffect } from "react";
import { getPools, addPool, updatePool, deletePool } from "../../services/Api";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from "@mui/material";
import { useSnackbar } from "../../SnackbarContext";
import "./Pools.css";

const PoolsTable = () => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [newPool, setNewPool] = useState({ name: "" });
  const openSnackBar = useSnackbar();

  useEffect(() => {
    fetchPools(openSnackBar);
  }, [openSnackBar]);

  const fetchPools = async (openSnackBar) => {
    try {
      const response = await getPools();
      console.log("fetching pools")
      if (response.data.status === "success") {
        setPools(response.data.response);
      } else if(response.data.status === "failure"){
        openSnackBar(response.data.errorMessage, 'Close', true)
      } else {
        setPools([]);
      }
    } catch (error) {
      console.error("Error fetching pools", error);
      openSnackBar("Error fetching pools", 'Close', true)
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPool = async () => {
    try {
      await addPool(newPool);
      openSnackBar("Pool added successfully", "Close", false);
      fetchPools();
      setOpen(false);
      setNewPool({ name: "" });
    } catch (error) {
      console.error("Error adding pool", error);
      openSnackBar("Error adding pool", 'Close', true);
    }
  };

  const handleEditPool = async () => {
    try {
      await updatePool(selectedPool);
      openSnackBar("Pool updated successfully", "Close", false);
      fetchPools();
      setEditOpen(false);
    } catch (error) {
      console.error("Error updating pool", error);
      openSnackBar("Error updating pool", 'Close', true);
    }
  };

  const handleDelPool = async (poolId) => {
    try {
      await deletePool(poolId);
      openSnackBar("Pool deleted successfully", "Close", false);
      fetchPools();
    } catch (error) {
      console.error("Error deleting pool", error);
      openSnackBar("Error deleting pool", 'Close', true);
    }
  }

  return (
    <div>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
           <CircularProgress />  {/* Material-UI Spinner */}
        </Box>
       ) : (
        <TableContainer className="table-container">
        <Box display="flex" justifyContent="flex-end">
        <Button variant="contained" className="add-pool-button" onClick={() => setOpen(true)}>
        <AddIcon fontSize="small"/> Add Pool
        </Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Pool Name</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pools.map((pool) => (
              <TableRow key={pool.id} onClick={() => { setSelectedPool(pool); setEditOpen(true); }} style={{ cursor: "pointer" }}>
                <TableCell>
                  <Box display="flex" justifyContent="space-between">
                    {pool.name}
                    <DeleteIcon className="del-button" 
                      onClick={(event) => {
                        event.stopPropagation(); // Prevents click from affecting parent elements
                        handleDelPool(pool.id);
                      }}/>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      )}

      {/* Add Pool Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs" // Controls max width (extra small)
        sx={{
          "& .MuiDialog-paper": { 
            width: { xs: "90vw", sm: "60vw", md: "400px" }, 
            maxWidth: "400px" 
          }
        }}>
        <DialogTitle>Add New Pool</DialogTitle>
        <DialogContent>
          <TextField label="Pool Name" fullWidth value={newPool.name} onChange={(e) => setNewPool({ name: e.target.value })} margin="dense" />
          <TextField label="Resource Type" fullWidth value="DCM" disabled style={{ marginTop: "10px" }} />
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="add-new-button" onClick={handleAddPool} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Pool Dialog */}
      {selectedPool && (
        <Dialog open={editOpen} onClose={() => setEditOpen(false)}
        fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
            }}>
          <DialogTitle>Edit Pool</DialogTitle>
          <DialogContent>
            <TextField label="Pool Name" fullWidth value={selectedPool.name} onChange={(e) => setSelectedPool({ ...selectedPool, name: e.target.value })} margin="dense"/>
            <TextField label="Resource Type" fullWidth value="DCM" disabled style={{ marginTop: "10px" }} />
          </DialogContent>
          <DialogActions>
            <Button className="cancel-button" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="add-new-button" onClick={handleEditPool} variant="contained" color="primary">Update</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default PoolsTable;
