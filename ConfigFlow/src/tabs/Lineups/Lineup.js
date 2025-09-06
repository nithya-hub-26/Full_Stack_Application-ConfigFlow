import React, { useEffect, useState } from "react";
import { List, ListItem, ListItemText, ListItemIcon, Collapse, Paper, Typography} from "@mui/material";
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from "@mui/icons-material/Add";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { getFolders, addFolder, updateFolder, deleteFolder } from "../../services/Api";
import { getLineups, addLineup, updateLineup, deleteLineup } from "../../services/Api";
import { getResources, getSources, getConfig, addLineupConfig, updateLineupConfig, deleteLineupConfig } from "../../services/Api";
import { useSnackbar } from "../../SnackbarContext";
import "./Lineup.css";

const FolderTreeView = () => {
  const [folders, setFolders] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [sources, setSources] = useState([]);
  const [resources, setResources] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedConfigs, setExpandedConfigs] = useState({});
  const [lineupOpen, setLineupOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editConfigOpen, setConfigEditOpen] = useState(false);
  const [editLineupOpen, setLineupEditOpen] = useState(false);
  const [editFolderOpen, setFolderEditOpen] = useState(false);
  const [selectedLineup, setSelectedLineup] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedConfig, setSelectedConfig] = useState("");
  const [newFolder, setNewFolder] = useState({ name: "", parentFolderId: ""});
  const [newLineup, setNewLineup] = useState({ name: "", parentFolderId: "", type: ""});
  const [newConfig, setNewConfig] = useState({ name: "", lineupId: "", idSrtGw: "", sourceName: "", sourceId: ""});
  const [loading, setLoading] = useState(true);
  const openSnackBar = useSnackbar();

  useEffect(() => {
    fetchLineupFolders(openSnackBar);
  }, [openSnackBar]);

  const fetchLineupFolders = async (openSnackBar) => {
    try {
      const folderResponse = await getFolders();
      const lineupResponse = await getLineups();
      const resourceResponse = await getResources();
      const sourceResponse = await getSources();
      
      console.log("fetching lineup folders")
      if (folderResponse.data.status === "success") {
        setFolders(folderResponse.data.response);
      } else if(folderResponse.data.status === "failure"){
        openSnackBar(folderResponse.data.errorMessage, 'Close', true)
      } else {
        setFolders([]);
      }

      console.log("fetching lineups")
      if (lineupResponse.data.status === "success") {
        setLineups(lineupResponse.data.response);
      } else if(lineupResponse.data.status === "failure"){
        openSnackBar(lineupResponse.data.errorMessage, 'Close', true)
      } else {
        setLineups([]);
      }

      console.log("fetching resources")
      if (resourceResponse.data.status === "success") {
        setResources(resourceResponse.data.response);
      } else if(resourceResponse.data.status === "failure"){
        openSnackBar(resourceResponse.data.errorMessage, 'Close', true)
      } else {
        setResources([]);
      }

      console.log("fetching sources")
      if (sourceResponse.data.status === "success") {
        setSources(sourceResponse.data.response);
      } else if(sourceResponse.data.status === "failure"){
        openSnackBar(sourceResponse.data.errorMessage, 'Close', true)
      } else {
        setSources([]);
      }

    } catch (error) {
      console.error("Error fetching lineups", error);
      openSnackBar("Error fetching lineups", 'Close', true)
      setFolders([]);
      setLineups([]);
      setResources([]);
      setSources([]);
    } finally {
      setLoading(false);
    }
  };
  
  // When dropdown button is clicked in a folder, expandedfolders are setted
  const handleToggle = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,    // Keep the existing expanded/collapsed states
      [folderId]: !prev[folderId],  // Toggle the clicked folder's state 
      // If prev[folderId] was true (expanded), it sets it to false (collapsed).
      // If prev[folderId] was false (collapsed) or undefined, it sets it to true (expanded).
    }));
  };

  const handleConfigToggle = (lineupId) => {
    setExpandedConfigs((prev) => ({
      ...prev,
      [lineupId]: !prev[lineupId],
    }));
  };

  // Organize folders into parent-child structure
  const getNestedFoldersAndLineups = () => {
    const folderMap = {};
    const lineupsWithoutParent = [];
  
    // Create a map of folders and initialize children
    folders.forEach(folder => {
      folderMap[folder.id] = { ...folder, children: [] };
    });
  
    // Organize folders and lineups
    lineups.forEach(lineup => {
      if (lineup.parentFolderId) {
        folderMap[lineup.parentFolderId]?.children.push({ ...lineup, isLineup: true });
      } else {
        lineupsWithoutParent.push({ ...lineup, isLineup: true });
      }
    });
  
    const rootFolders = [];
    folders.forEach(folder => {
      if (folder.parentFolderId) {
        folderMap[folder.parentFolderId]?.children.push(folderMap[folder.id]);
      } else {
        rootFolders.push(folderMap[folder.id]);
      }
    });
  
    return { rootFolders, lineupsWithoutParent };
  };
  
  const handleAddLineup = async () => {
    // Validation Check
    const errors = {
      name: !newLineup.name.trim(),
      type: !newLineup.type,
    };

    if (errors.name || errors.type) {
      openSnackBar("Please fill in all required fields.", "Close", true);
      return;
    }
    try {
        await addLineup(newLineup);
        openSnackBar("Lineup added successfully", "Close", false);
        fetchLineupFolders();
        setLineupOpen(false);
        setNewLineup({ name: "", parentFolderId: "", type: "" });
      } catch (error) {
        openSnackBar("Error adding lineup", 'Close', true);
      }
    };

  const handleEditLineup = async () => {
    try {
      await updateLineup(selectedLineup);
      openSnackBar("Lineup updated successfully", "Close", false);
      fetchLineupFolders();
      setLineupEditOpen(false);
    } catch (error) {
      openSnackBar("Error updating lineup", "Close", true);
    }
  };

  const handleDeleteLineup = async (id) => {
    try {
      await deleteLineup(id);
      openSnackBar("Lineup deleted successfully", "Close", false);
      fetchLineupFolders();
    } catch (error) {
      openSnackBar("Error deleting lineup", "Close", true);
    }
  };

  const handleAddConfig = async () => {
    // Validation Check
    const errors = {
      name: !newConfig.name.trim(),
      idSrtGw: !newConfig.idSrtGw,
      sourceName: !newConfig.sourceName,
      sourceId: !newConfig.sourceId,
      lineupId: !newConfig.lineupId,
    };

    if (errors.name || errors.idSrtGw || errors.sourceName || errors.sourceId || errors.lineupId) {
      openSnackBar("Please fill in all required fields.", "Close", true);
      return;
    }
    try {
        await addLineupConfig(newConfig, newConfig.lineupId);
        openSnackBar("Config added successfully", "Close", false);
        fetchLineupFolders();
        setConfigOpen(false);
        setNewConfig({ name: "", lineupId: "", idSrtGw: "", sourceName: "", sourceId: ""});
      } catch (error) {
        openSnackBar("Error adding config", 'Close', true);
      }
    };

  const handleEditConfig = async () => {
    try {
      await updateLineupConfig(selectedConfig, selectedConfig.id);
      openSnackBar("Lineup Configuration updated successfully", "Close", false);
      fetchLineupFolders();
      setConfigEditOpen(false);
    } catch (error) {
      openSnackBar("Error updating lineup configuration", "Close", true);
    }
  };

  const handleDeleteConfig = async (id) => {
    try {
      await deleteLineupConfig(id);
      openSnackBar("Lineup Configuration deleted successfully", "Close", false);
      fetchLineupFolders();
    } catch (error) {
      openSnackBar("Error deleting lineup configuration", "Close", true);
    }
  };

  const handleAddFolder = async () => {
    try {
      await addFolder(newFolder);
      openSnackBar("Folder added successfully", "Close", false);
      fetchLineupFolders();
      setFolderOpen(false);
      setNewFolder({ name: "", parentFolderId: "" });
    } catch (error) {
      openSnackBar("Error adding folder", "Close", true);
    }
  };

  const handleEditFolder = async () => {
    try {
      await updateFolder(selectedFolder);
      openSnackBar("Folder updated successfully", "Close", false);
      fetchLineupFolders();
      setFolderEditOpen(false);
    } catch (error) {
      openSnackBar("Error updating folder", "Close", true);
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await deleteFolder(id);
      openSnackBar("Folder deleted successfully", "Close", false);
      fetchLineupFolders();
    } catch (error) {
      openSnackBar("Error deleting folder", "Close", true);
    }
  };

  // Render folders and lineups recursively
  const renderFoldersAndLineups = (folderList=[], level = 0) => {
  
    return (
    <List className="folder-list">
      {folderList.map((item) => (
        <div key={item.id}>
          <ListItem className={`${item.isLineup ? "lineup-item" : "folder-item"}`} style={{ paddingLeft: `${level * 20}px` }}>
            <ListItemIcon className="folder-icon">
              {item.isLineup ? <ListAltIcon/> : <FolderIcon />}
            </ListItemIcon>
            <ListItemText>
              <p
               className="list-item-text"
               onClick={() => {
                if (item.isLineup) {
                  setSelectedLineup(item);
                  setLineupEditOpen(true);
                } else {
                  setSelectedFolder(item);
                  setFolderEditOpen(true);
                }
              }}
            >
            {item.isLineup ? item.lineup : item.name}
            </p>
            </ListItemText>

            {/* Expand more (or) less icon for configurations*/}
            {item.isLineup && item.configurations.length > 0? 
             (
             <div onClick={(e) => { 
              e.stopPropagation(); 
              handleConfigToggle(item.lineupId);
             }}>
             {expandedConfigs[item.lineupId] ? <ExpandLess className="expand-icon" /> : <ExpandMore className="expand-icon" />}
             </div>
            ) 
            : null}

            {/* Expand more (or) less icon for folders*/}
            {!item.isLineup && item.children.length > 0? 
             (
             <div onClick={(e) => { 
              e.stopPropagation(); 
              handleToggle(item.id);
             }}>
             {expandedFolders[item.id] ? <ExpandLess className="expand-icon" /> : <ExpandMore className="expand-icon" />}
           </div>
            ) : null}
            <DeleteIcon className="del-button" 
              onClick={(event) => {
              event.stopPropagation(); // Prevents click from affecting parent elements 
              // Below line added for warning
              // eslint-disable-next-line 
              {item.isLineup ? handleDeleteLineup(item.lineupId) : handleDeleteFolder(item.id)};
            }}/>
          </ListItem>

          {item.isLineup && (
          <Collapse in={expandedConfigs[item.lineupId]} timeout="auto">
           {item.configurations.map((configs) => (
              <div key={configs.configurationId}>
              <ListItem className="lineup-item" style={{ paddingLeft: `${level * 40}px` }}>
                <ListItemIcon className="folder-icon">
                  <SettingsIcon/>
                </ListItemIcon>
                <ListItemText>
                  <p className="list-item-text"
                   onClick={async () => {
                    try {
                      const response = await getConfig(configs.configurationId)                  
                      const configData = response.data.response;
                      configData.lineupId = item.lineupId;
                      setSelectedConfig(configData);
                      setConfigEditOpen(true);
                    } catch (error) {
                      console.error("Error fetching config details:", error);
                    }
                   }}
                  >
                    {configs.configuration}
                  </p>
                </ListItemText>
                <DeleteIcon className="del-button" 
                  onClick={(event) => {
                  event.stopPropagation(); // Prevents click from affecting parent elements
                  handleDeleteConfig(configs.configurationId);
                }}/>
              </ListItem>
              </div>
           ))}
          </Collapse>
          )}

          {!item.isLineup && (
          <Collapse in={expandedFolders[item.id]} timeout="auto">
          {/*	in => If true, the component will transition in to show the expanded folders.
              timeout => Animates expand/collapse transitions. 
                      => 'auto' to automatically calculate transition time based on height.
          */}

            {renderFoldersAndLineups(item.children, level + 1)}
          </Collapse>

          )}
        </div>
      ))}
    </List>
    );
  };

  const { rootFolders, lineupsWithoutParent } = getNestedFoldersAndLineups() || { rootFolders: [], lineupsWithoutParent: [] };

  return (
    <div>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
           <CircularProgress />  {/* Material-UI Spinner */}
        </Box>
       ): (
        <Paper elevation={4} className="folder-container">    {/* Provides a structured, card-like container with a slight shadow.*/}
          <Typography variant="h6" className="folder-header">Lineup Folders</Typography>
          <Box className="folder-actions">
            <Button variant="contained" className="add-button" onClick={() => setConfigOpen(true)}>
              <AddIcon fontSize="small"/> Add Configuration
            </Button>
            <Box className="lineup-actions">
              <Button variant="contained" className="add-button" onClick={() => setFolderOpen(true)}>
                <AddIcon fontSize="small"/> Add Folder
              </Button>
              <Button variant="contained" className="add-button" onClick={() => setLineupOpen(true)}>
                <AddIcon fontSize="small"/> Add Lineup
              </Button>
            </Box>
          </Box>

          {/* Display folders */}
          {renderFoldersAndLineups(rootFolders)}
          {/* Display standalone lineups next */}
          {renderFoldersAndLineups(lineupsWithoutParent)}
        </Paper>
       )}

       {/* Add Lineup Dialog */}
      <Dialog open={lineupOpen} onClose={() => setLineupOpen(false)} 
            fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
            }}
          >
        <DialogTitle>Add New Lineup</DialogTitle>
        <DialogContent>
          <TextField label="Lineup Name" fullWidth value={newLineup.name} onChange={(e) => setNewLineup({ ...newLineup, name: e.target.value })} margin="dense" required/>
          <TextField select label="Parent Folder" fullWidth value={newLineup.parentFolderId} onChange={(e) => setNewLineup({ ...newLineup, parentFolderId: e.target.value })} margin="dense">
            <MenuItem value="">None</MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
                {folder.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Resource Type" fullWidth value={newLineup.type} onChange={(e) => setNewLineup({ ...newLineup, type: e.target.value })} margin="dense" required>
            <MenuItem value="VDCM_ABR">VDCM ABR</MenuItem>
            <MenuItem value="SINGLE_STAGE_REST">Single Stage REST</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setLineupOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleAddLineup} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>  

      {/* Edit Lineup Dialog */}
      {selectedLineup && (
        <Dialog open={editLineupOpen} onClose={() => setLineupEditOpen(false)}
            fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
          }}>
        <DialogTitle>Edit Lineup</DialogTitle>
        <DialogContent>
          <TextField label="Lineup Name" fullWidth value={selectedLineup.lineup} onChange={(e) => setSelectedLineup({ ...selectedLineup, lineup: e.target.value })} margin="dense" required/>
          <TextField select label="Parent Folder" fullWidth value={selectedLineup.parentFolderId} onChange={(e) => setSelectedLineup({ ...selectedLineup, parentFolderId: e.target.value })} margin="dense">
          <MenuItem value="">None</MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
                {folder.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Resource Type" fullWidth value={selectedLineup.type} onChange={(e) => setSelectedLineup({ ...selectedLineup, type: e.target.value })} margin="dense" required >
            <MenuItem value="VDCM_ABR">VDCM ABR</MenuItem>
            <MenuItem value="SINGLE_STAGE_REST">Single Stage REST</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setLineupEditOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleEditLineup} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog>  
      )}

      {/* Add Lineup Config Dialog */}
      <Dialog open={configOpen} onClose={() => setConfigOpen(false)} 
            fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
            }}
          >
        <DialogTitle>Add New Config</DialogTitle>
        <DialogContent>
          <TextField label="Config Name" fullWidth value={newConfig.name} onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })} margin="dense" required/>
          <TextField select label="Lineup Name" fullWidth value={newConfig.lineupId} onChange={(e) => setNewConfig({ ...newConfig, lineupId: e.target.value })} margin="dense" required>
            {lineups
            .filter((lineup) => lineup.lineupType === "SINGLE_STAGE_REST")
            .map((lineup) => (
              <MenuItem key={lineup.lineupId} value={lineup.lineupId}>
                {lineup.lineup}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Resource Type" fullWidth value="Single Stage REST" margin="dense" disabled/>
          <TextField select label="SRT Gateway" name="idSrtGw" fullWidth value={newConfig.idSrtGw} onChange={(e) => setNewConfig({ ...newConfig, idSrtGw: e.target.value })} margin="dense" required>
          {resources.map((resource) => (
            <MenuItem key={resource.id} value={resource.id}>
              {resource.name}
            </MenuItem>
          ))}
          </TextField>
          <TextField select label="Source Name" name="sourceName" fullWidth value={newConfig.sourceId}
           onChange={(e) => {
            const selectedSource = sources.find(source => source.id === e.target.value);
            setNewConfig({ ...newConfig, sourceName: selectedSource.name, sourceId: selectedSource.id })}
            }  margin="dense" required>
            {sources.map((source) => (
            <MenuItem key={source.id} value={source.id}>
              {source.name}
            </MenuItem>
            ))}
        </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setConfigOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleAddConfig} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>  

      {/* Edit Lineup Config Dialog */}
      {selectedConfig && (
        <Dialog open={editConfigOpen} onClose={() => setConfigEditOpen(false)} 
            fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
            }}
          >
        <DialogTitle>Edit Config</DialogTitle>
        <DialogContent>
          <TextField label="Config Name" fullWidth value={selectedConfig.name} onChange={(e) => setSelectedConfig({ ...selectedConfig, name: e.target.value })} margin="dense" required/>
          <TextField select label="Lineup Name" fullWidth value={selectedConfig.lineupId} onChange={(e) => setSelectedConfig({ ...selectedConfig, lineupId: e.target.value })} margin="dense" required>
            {lineups
            .filter((lineup) => lineup.lineupId === selectedConfig.lineupId)
            .map((lineup) => (
              <MenuItem key={lineup.lineupId} value={lineup.lineupId}>
                {lineup.lineup}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Resource Type" fullWidth value="Single Stage REST" margin="dense" disabled/>
          <TextField select label="SRT Gateway" name="idSrtGw" fullWidth 
            value={selectedConfig.allocationResource?.id || ""}
            onChange={(e) => 
              setSelectedConfig({ 
                ...selectedConfig, 
                allocationResource: { ...selectedConfig.allocationResource, id: e.target.value } 
              })
            } margin="dense" required>
            {resources.map((resource) => (
              <MenuItem key={resource.id} value={resource.id}>
                {resource.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField select label="Source Name" name="sourceName" fullWidth 
            value={selectedConfig.sources?.[0]?.source?.id || ""}
            onChange={(e) => {
              const selectedSource = sources.find(source => source.id === e.target.value) || {};
              setSelectedConfig({
                ...selectedConfig,
                sources: [{
                  source: {
                    ...selectedConfig.sources?.[0]?.source, 
                    id: selectedSource.id || "",
                    name: selectedSource.name || ""
                  }
                }]
              });
            }}  
            margin="dense" required>
            {sources.map((source) => (
              <MenuItem key={source.id} value={source.id}>
                {source.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setConfigEditOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleEditConfig} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog> 
      )} 
      
      {/* Add Folder Dialog */}
      <Dialog open={folderOpen} onClose={() => setFolderOpen(false)}
        fullWidth
        maxWidth="xs" // Controls max width (extra small)
        sx={{
          "& .MuiDialog-paper": { 
            width: { xs: "90vw", sm: "60vw", md: "400px" }, 
            maxWidth: "400px" 
          }
        }}>
        <DialogTitle>Add New Folder</DialogTitle>
        <DialogContent>
          <TextField label="Folder Name" fullWidth value={newFolder.name} onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })} margin="dense" required/>
          <TextField select label="Parent Folder" fullWidth value={newFolder.parentFolderId} onChange={(e) => setNewFolder({ ...newFolder, parentFolderId: e.target.value })} margin="dense">
          <MenuItem value="">None</MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
                {folder.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setFolderOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleAddFolder} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>    

      {/* Edit Folder Dialog */}
      {selectedFolder && (
        <Dialog open={editFolderOpen} onClose={() => setFolderEditOpen(false)}
        fullWidth
            maxWidth="xs" // Controls max width (extra small)
            sx={{
              "& .MuiDialog-paper": { 
                width: { xs: "90vw", sm: "60vw", md: "400px" }, 
                maxWidth: "400px" 
              }
            }}>
        <DialogTitle>Edit Folder</DialogTitle>
        <DialogContent>
          <TextField label="Folder Name" fullWidth value={selectedFolder.name} onChange={(e) => setSelectedFolder({ ...selectedFolder, name: e.target.value })} margin="dense"/>
          <TextField select label="Parent Folder" fullWidth value={selectedFolder.parentFolderId} onChange={(e) => setSelectedFolder({ ...selectedFolder, parentFolderId: e.target.value })} margin="dense">
          <MenuItem value="">None</MenuItem>
            {folders.map((folder) => (
              <MenuItem key={folder.id} value={folder.id}>
                {folder.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button className="cancel-button" onClick={() => setFolderEditOpen(false)}>Cancel</Button>
          <Button className="add-lineup-button" onClick={handleEditFolder} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog>  
      )} 

    </div>
  );
};

export default FolderTreeView;
