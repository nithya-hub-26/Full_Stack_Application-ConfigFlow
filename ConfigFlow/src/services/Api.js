import axios from "axios"
import { getUserData } from "./Storage";

// **Firebase API Instance**
const firebaseClient = axios.create({
    baseURL: "https://identitytoolkit.googleapis.com/v1/", // Firebase API
  });

const API_KEY = "AIzaSyAogxde83y48dy83edh34_jybLzt4";
const REGISTER_URL = `/accounts:signUp?key=${API_KEY}`;
const LOGIN_URL = `/accounts:signInWithPassword?key=${API_KEY}`
const DISPLAYNAME_URL = `/accounts:lookup?key=${API_KEY}`

export const loginUser = (email, password) => {
    let data = { email, password };
    return firebaseClient.post(LOGIN_URL, data);  
};

export const registerUser = (displayName, email, password) => {
    let data = { displayName, email, password };
    return firebaseClient.post(REGISTER_URL, data);  
};

export const displayNameUser = () => {
    let data = { idToken: getUserData() };
    return firebaseClient.post(DISPLAYNAME_URL, data);
};


// **Backend API Instance (Flask)**
const backendClient = axios.create({
    baseURL: "http://127.0.0.1:5000", // Flask API base URL
    headers: {
      "Content-Type": "application/json",
    },
  });

const POST_CUSTOKEN_URL = "/generate-token";

const GET_DASHBOARD_URL = "/list-dashboards";
const GET_SOURCE_URL = "/list-sources";
const GET_RESOURCE_URL = "/list-resources";

const GET_LINEUP_URL = "/list-lineups";
const POST_LINEUP_URL = "/create-lineup";
const PUT_LINEUP_URL = "/update-lineup";
const DELETE_LINEUP_URL = "/del-lineup";

const GET_CONFIG_URL = "/list-config";
const POST_LINEUP_CONFIG_URL = "/create-lineup-config";
const PUT_LINEUP_CONFIG_URL = "/update-lineup-config";
const DELETE_LINEUP_CONFIG_URL = "/del-lineup-config";

const GET_LINEUP_FOLDER_URL = "/list-lineup-folders";
const POST_LINEUP_FOLDER_URL = "/create-lineup-folder";
const PUT_LINEUP_FOLDER_URL = "/update-lineup-folder";
const DELETE_LINEUP_FOLDER_URL = "/del-lineup-folder";

const GET_POOL_URL = "/list-pools";
const POST_POOL_URL = "/create-pool"
const PUT_POOL_URL = "/update-pool"
const DELETE_POOL_URL = "/del-pool";

const GET_LOGS_URL = "/get-logs";

export const getCustoken = () => backendClient.post(POST_CUSTOKEN_URL);
export const getDashboards = () => backendClient.get(GET_DASHBOARD_URL);
export const getSources = () => backendClient.get(GET_SOURCE_URL);
export const getResources = () => backendClient.get(GET_RESOURCE_URL);

export const getLineups = () => backendClient.get(GET_LINEUP_URL);
export const addLineup = (data) => backendClient.post(POST_LINEUP_URL, data)
export const updateLineup = (lineup) => backendClient.put(PUT_LINEUP_URL, lineup)
export const deleteLineup = (id) => backendClient.delete(`${DELETE_LINEUP_URL}/${id}`);

export const getConfig = (id) => backendClient.get(`${GET_CONFIG_URL}/${id}`)
export const addLineupConfig = (data, id) => backendClient.post(`${POST_LINEUP_CONFIG_URL}/${id}`, data)
export const updateLineupConfig = (data, id) => backendClient.put(`${PUT_LINEUP_CONFIG_URL}/${id}`, data)
export const deleteLineupConfig = (id) => backendClient.delete(`${DELETE_LINEUP_CONFIG_URL}/${id}`);

export const getFolders = () => backendClient.get(GET_LINEUP_FOLDER_URL);
export const addFolder = (data) => backendClient.post(POST_LINEUP_FOLDER_URL, data)
export const updateFolder = (folder) => backendClient.put(PUT_LINEUP_FOLDER_URL, folder)
export const deleteFolder = (id) => backendClient.delete(`${DELETE_LINEUP_FOLDER_URL}/${id}`);

export const getPools = () => backendClient.get(GET_POOL_URL);
export const addPool = (data) => backendClient.post(POST_POOL_URL, data);
export const updatePool = (pool) => backendClient.put(PUT_POOL_URL, pool)
export const deletePool = (id) => backendClient.delete(`${DELETE_POOL_URL}/${id}`);

export const getLogs = (filename) => backendClient.get(`${GET_LOGS_URL}/${filename}`);
