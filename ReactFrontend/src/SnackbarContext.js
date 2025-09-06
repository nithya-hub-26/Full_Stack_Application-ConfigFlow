import React, { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

// Creates a React Context which allows components anywhere in the app.
const SnackbarContext = createContext();

// It wraps the entire app (inside index.js) so that all components inside it can use the snackbar.
export const SnackbarProvider = ({ children }) => {
  const [snack, setSnack] = useState({ open: false, message: "", severity: "" });

  // Memoize `openSnackBar` so it doesn't trigger useEffect loops
  // useCallback is used to prevent unnecessary re-renders (memoizing the function).
  const openSnackBar = useCallback((message, action, isError) => {
    setSnack({open: true, message, action, severity: isError ? "error" : "success"});
  }, []);

  //This makes the openSnackBar function globally available to all components inside the app.
  // Children means all components comes within that
  return (
    <SnackbarContext.Provider value={openSnackBar}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// This is a custom hook to use the snackbar in any component.
// Instead of useContext(SnackbarContext) every time, you can simply call: const openSnackBar = useSnackbar();
export const useSnackbar = () => useContext(SnackbarContext);
