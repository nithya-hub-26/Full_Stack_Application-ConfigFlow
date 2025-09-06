import axios from "axios";
import { Source } from './struct';

// **Backend API Instance (Flask)**
const backendClient = axios.create({
    baseURL: "http://localhost:5000", // Flask API base URL
    headers: {
      "Content-Type": "application/json",
    },
  });

const POST_CUSTOKEN_URL = "/generate-token";

const GET_DESTINATION_URL = "/list-destinations";
const GET_SOURCE_URL = "/list-sources";
const GET_RESOURCE_URL = "/list-resources";
const GET_AUDIO_TEMPLATES_URL = "/list-audio-templates";
const GET_VIDEO_TEMPLATES_URL = "/list-video-templates";
const GET_LINK_MAP_URL = "/get-activated-ids";
const GET_MESSAGES_URL = "/get-alarm-messages";
const GET_RESOURCE_STATE = "/get-resource-state"

const POST_LINEUP_STATUS_URL = "/post-active-or-deactivate-id";
const POST_DESTINATION_URL = "/add-destination";
const POST_SOURCE_URL = "/add-source";
const POST_AUDIO_TEMPLATE_URL = "/add-audio-template";
const POST_LINEAR_TEMPLATE_URL = "/add-linear-template";

const PUT_SOURCE_URL = "/update-source";
const PUT_LINEAR_TEMPLATE_URL = "/update-linear-template";
const PUT_AUDIO_TEMPLATE_URL = "/update-audio-template";

const DELETE_SOURCE_URL = "/delete-source";
const DELETE_DESTINATION_URL = "/delete-destination";
const DELETE_AUDIO_TEMPLATE_URL = "/delete-audio-template";
const DELETE_LINEAR_TEMPLATE_URL = "/delete-linear-template";

export const getCustoken = () => backendClient.post(POST_CUSTOKEN_URL);
export const getDestinations = () => backendClient.get(GET_DESTINATION_URL);
export const getSources = () => backendClient.get(GET_SOURCE_URL);
export const getResources = () => backendClient.get(GET_RESOURCE_URL);
export const getAudioTemplates = () => backendClient.get(GET_AUDIO_TEMPLATES_URL)
export const getVideoTemplates = () => backendClient.get(GET_VIDEO_TEMPLATES_URL)
export const getActivateIds = () => backendClient.get(GET_LINK_MAP_URL)
export const getMessages = (id: string) => backendClient.get(`${GET_MESSAGES_URL}/${id}`)
export const getResourceState = (url: string) => backendClient.get(`${GET_RESOURCE_STATE}/${url}`)

export const updateStatus = (data: any, id: string) => backendClient.post(`${POST_LINEUP_STATUS_URL}/${id}`,data)
export const addSource = (data: any) => backendClient.post(POST_SOURCE_URL, data)
export const addDestination = (data: any) => backendClient.post(POST_DESTINATION_URL, data)
export const addAudioTemplate = (data: any) => backendClient.post(POST_AUDIO_TEMPLATE_URL, data)
export const addLinearTemplate = (data: any) => backendClient.post(POST_LINEAR_TEMPLATE_URL, data)

export const updateSource = (data: Source) => backendClient.put(`${PUT_SOURCE_URL}/${data.id}`,data)
export const updateLinearTemplate = (data: any, id: string) => backendClient.put(`${PUT_LINEAR_TEMPLATE_URL}/${id}`,data)
export const updateAudioTemplate = (data: any, id: string) => backendClient.put(`${PUT_AUDIO_TEMPLATE_URL}/${id}`,data)

export const delSource = (data: any) => backendClient.delete(DELETE_SOURCE_URL, {
    headers: { 'Content-Type': 'application/json' },
    data: data,
  })
export const delDestination = (data: any) => backendClient.delete(DELETE_DESTINATION_URL, {
    headers: { 'Content-Type': 'application/json' },
    data: data,
  })
export const delAudioTemplate = (id: string) => backendClient.delete(`${DELETE_AUDIO_TEMPLATE_URL}/${id}`)
export const delLinearTemplate = (id: string) => backendClient.delete(`${DELETE_LINEAR_TEMPLATE_URL}/${id}`)