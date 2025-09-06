import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CodeIcon from "@mui/icons-material/Code";
import ApiIcon from "@mui/icons-material/Api";
import "./Help.css";

const helpLinks = [
  { name: "User's Guide", url: "https://10.10.10.10/ui/guide/User_Guide.pdf", icon: <PictureAsPdfIcon/> },
  { name: "Online Help", url: "https://10.10.10.10/ui/guide/index.htm", icon: <HelpOutlineIcon/> },
  { name: "REST API Documentation", url: "https://10.10.10.10/api-doc.html", icon: <CodeIcon/> },
  { name: "REST API Swagger UI", url: "https://10.10.10.10/api-doc", icon: <ApiIcon/> },
];

const HelpTable = () => {
  return (
    <TableContainer component={Paper} className="help-table">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="table-header">Name</TableCell>
            <TableCell className="table-header">Link</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {helpLinks.map((link, index) => (
            <TableRow key={index}>
              <TableCell>{link.name}</TableCell>
              <TableCell>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="help-link">
                  {link.icon}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
);
};

export default HelpTable;
