import { useRef, useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { Home, Video, DownloadCloud as CloudDownload, ChevronDown, ChevronRight, Search, Plus, X, ChevronUp, Filter, Book, Copy, Check, Trash, Database,Radio, AlertTriangle } from 'lucide-react';
import logo from './synamedia-logo.png'
import MapComponent from './MapComponent';
import { Source, Destination, AudioTemplate, LinearTemplate, ABRTemplate, ToolTip, Link, Resource, Message} from './struct';
import { getSources, getDestinations, getAudioTemplates, getVideoTemplates, getActivateIds, getResources, getMessages, updateStatus, addDestination, addSource, addAudioTemplate, addLinearTemplate, delSource, delDestination, delAudioTemplate, delLinearTemplate, updateSource, updateLinearTemplate, updateAudioTemplate, getResourceState } from './Api';


function App() {
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const [selectedSidebarItem, setSelectedSidebarItem] = useState('Dashboard');
  const [treeExpanded, setTreeExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSourceDialog, setShowAddSourceDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showAddDestinationDialog, setShowAddDestinationDialog] = useState(false);
  const [showAddAudioTemplateDialog, setShowAddAudioTemplateDialog] = useState(false);
  const [showAddVideoTemplateDialog, setShowAddVideoTemplateDialog] = useState(false);
  const [showAddABRTemplateDialog, setShowAddABRTemplateDialog] = useState(false);
  const [editAudioTemplateDialog, setEditAudioTemplateDialog] = useState(false);
  const [editVideoTemplateDialog, setEditVideoTemplateDialog] = useState(false);
  const [editABRTemplateDialog, setEditABRTemplateDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [audioTemplates, setAudioTemplates] = useState<AudioTemplate[]>([]);
  const [videoTemplates, setVideoTemplates] = useState<LinearTemplate[]>([]);
  const [abrTemplates, setAbrTemplates] = useState<LinearTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'ABR' >('video');
  const [selectedAudioTemplate, setSelectedAudioTemplate] = useState<AudioTemplate | null>(null);
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<LinearTemplate | null>(null);
  const [selectedABRTemplate, setSelectedABRTemplate] = useState<ABRTemplate | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [sortField, setSortField] = useState<keyof Source | keyof AudioTemplate | keyof LinearTemplate | keyof ABRTemplate | keyof Destination | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [addSourceStep, setAddSourceStep] = useState(1);
  const [selectedSourceIdForDestination, setSelectedSourceForDestination] = useState('');
  const [transcodingEnabled, setTranscodingEnabled] = useState(false);
  const [selectedTemplateId, setselectedTemplateId] = useState('')
  const [linkMap, setLinkMap] = useState<Link[]>([]);
  const [animationKey, setAnimationKey] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lineX2, setLineX2] = useState<number>(480);
  const [tooltipData, setTooltipData] = useState<ToolTip | null>(null);
  const [showAlarmTooltip, setShowAlarmTooltip] = useState(false);
  const [selectedAlarmLineupId, setSelectedAlarmLineupId] = useState<string | null>(null);
  const [appState, setAppState] = useState("Not Ready");
  const referenceRef = useRef(null);
  const popperRef = useRef(null);
  const itemsPerPage = 10;

  const { styles, attributes, update } = usePopper(referenceRef.current, popperRef.current, {
  placement: 'top',
  modifiers: [
    {
      name: 'flip',
      options: {
        fallbackPlacements: ['bottom'],
      },
    },
    {
      name: 'preventOverflow',
      options: {
        padding: 8,
      },
    },
  ],
});

  const getRelatedDestinations = (source: Source | null) => {
  if (!source) return [];

  const linkedMapping = linkMap
    .filter(link => link.sourceId === source.id)
    .map(link => {
      const destination = destinations.find(dest => dest.id === link.destinationId);
      const linkedaudiotemplate = audioTemplates.find(temp => temp.name === link.templateId);
      const linkedvideotemplate = videoTemplates.find(temp => temp.name === link.templateId);

      if (!destination) return null;

      return {
        destination,
        template: linkedaudiotemplate?.name || linkedvideotemplate?.name || null,
      };
    })
    .filter(item => item !== null); // Remove any null entries

  return linkedMapping;
};

   useEffect(() => {
    loadSources()
    loadDestinations()
    loadAudioTemplates()
    loadVideoTemplates()
    loadLinkMap()
    loadResources()
    updateX2();
    window.addEventListener("resize", updateX2);
    return () => window.removeEventListener("resize", updateX2);
  }, []);

  useEffect(()=>{
    loadSources()
    loadDestinations()
    loadAudioTemplates()
    loadVideoTemplates()
    loadLinkMap()
    loadResources()
    setAnimationKey(prev => prev + 1);
    if (containerRef.current) {
    containerRef.current.scrollTop = 0;
  }
  },[selectedSource])

  useEffect(() => {
  if (showAlarmTooltip) {
    update?.();
  }
}, [showAlarmTooltip, messages]);

  useEffect(() => {
  if (!selectedSource) return;

  const resource = resources.find(resrc => resrc.id === selectedSource.resourceId);
  if (!resource?.restApiHost) return;

  fetchResourceState(resource.restApiHost);
}, [selectedSource, resources]);

const updateX2 = () => {
  const screenWidth = window.innerWidth;

  if (screenWidth <= 745) {
    setLineX2(480); // 100%
  } else if (screenWidth <= 828) {
    setLineX2(560); // 90%
  } else if (screenWidth <= 932) {
    setLineX2(680); // 80%
  } else {
    setLineX2(720); // Default/fallback for larger screens
  }
  };

  const loadSources = async () => {
    console.log("Fetching sources...");
    try {
      const response = await getSources();
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const sourcesData: Source[] = data.response
        setSources(sourcesData); 
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching sources:', error);
    };
  }

  const loadDestinations = async () => {
    console.log("Fetching destinations...");
    try {
      const response = await getDestinations();
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const destinationsData: Destination[] = data.response
        setDestinations(destinationsData); 
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching destinations:', error);
    };
  }

   const loadAudioTemplates = async () => {
    console.log("Fetching audio templates...");
    try {
      const response = await getAudioTemplates();
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const audiotemplateData: AudioTemplate[] = data.response;
        setAudioTemplates(audiotemplateData);
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching audio templates:', error);
    };
  }

  const loadVideoTemplates = async () => {
    console.log("Fetching video templates...");
    try {
      const response = await getVideoTemplates();
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const videotemplateData: LinearTemplate[] = data.response 
        setVideoTemplates(videotemplateData)
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching video templates:', error);
    };
  }

  const loadLinkMap = async () => {
    console.log("Fetching link map...");
    try {
      const response = await getActivateIds();
      const data = response.data;
      if (data.status === 'success') {
        console.log("Activated IDs:", data.ids);
        setLinkMap(data.ids)
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching link mapping:', error);
    };
  }

  const fetchResourceState = async (url: string) => {
    try {
      const response = await getResourceState(url);
      const data = response.data;
      if (data.status === 'success') {
        console.log("Resource State response:", data.response);
        if (data.response?.appState === "Ready") {
          setAppState("Ready");
        }
      } else {
        console.error(data.errorMessage);  
      }
    }catch(error){
      console.error("Error fetching resource state:", error);
      setAppState("Not Ready")
    }
  }

  const loadResources = async () => {
    console.log("Fetching resources...");
    try {
      const response = await getResources();
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const resourcesData: Resource[] = data.response 
        setResources(resourcesData);
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error('Error fetching resources:', error);
    };
  }

  const loadMessages = async (lineupId: string) => {
    console.log(`Fetching alarm messages for ${lineupId}`);
    setMessages([]);
    setSelectedAlarmLineupId("")
    try {
      setShowAlarmTooltip((prev) => !prev);
      setTimeout(() => update?.(), 10);
      setSelectedAlarmLineupId(lineupId)
      const response = await getMessages(lineupId);
      const data = response.data;
      if (data.status === 'success') {
        console.log(data.response);
        const messagesData: Message[] = data.response 
        setMessages(messagesData);
      } else {
        console.error(data.errorMessage);  
      }
    }
    catch(error) {
      console.error(`Error fetching messages for ${lineupId}:`, error);
    };
  }


  const [newSource, setNewSource] = useState({
    name: '',
    lineupId: '',
    resourceId: "",
    sourceId: "",
    sourceName: "",
    lineupStatus: 'Deactive',
    ingestType: '',
    ingestRegion: '',
    alarmStatus: '',
    connectionString: '',
    encryptionSettings: 'Disabled',
    passphrase: '',
    latency: 0
}); 

  const [newDestination, setNewDestination] = useState({
    id: '',
    name: '',
    lineupId: '',
    resourceId: "",
    deliveryType: '',
    address: '',
    cloudDeliveryRegion: '',
    connectionStatus: "",
    alarmStatus: '',
  }); 

  const [newAudioTemplate, setNewAudioTemplate] = useState({
    id: '',
    name: '',
    type: 'audio',
    audioOutputCodec: '',
    bitrate: ''
  });

  const [newVideoTemplate, setNewVideoTemplate] = useState({
    id: '',
    name: '',
    type: 'linear',
    videoOutputCodec: '',
    hResolution: '',
    vResolution: '',
    frameRate: '',
  });

    const [newABRTemplate, setNewABRTemplate] = useState({
    id: '',
    name: '',
    type: 'linear',
    videoOutputCodec: '',
    resolution: '',
    frameRate: '',
  });

  const sidebarItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Sources', icon: Video },
    { name: 'Destinations', icon: CloudDownload },
    { name: 'Templates', icon: Book },
  ];


  const handleSort = (field: keyof Source | keyof AudioTemplate | keyof LinearTemplate | keyof ABRTemplate | keyof Destination) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (source: Source) => {
    setSelectedSource(source);
    setShowConfigDialog(true);
  };

  const handleAudioTemplateRowClick = (template: AudioTemplate) => {
    setSelectedAudioTemplate(template);
    setEditAudioTemplateDialog(true);
  };

  const handleVideoTemplateRowClick = (template: LinearTemplate) => {
    setSelectedVideoTemplate(template);
    setEditVideoTemplateDialog(true);
  };

  const handleABRTemplateRowClick = (template: ABRTemplate) => {
    setSelectedABRTemplate(template);
    setEditABRTemplateDialog(true);
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleActiveDeactive = async (selectedSource: Source) => {
      const newStatus = selectedSource.lineupStatus === 'Active' ? 'Deactive' : 'Active';
      try {
        const response = await updateStatus({ status: newStatus }, selectedSource.id)  
        const data = response.data;
        if (data.status === 'success') {
          console.log(data.response);
          updateSelectedSource('lineupStatus', newStatus);
        }
        else {
        console.error(data.errorMessage);  
        }       
      } catch (error) {
        console.error('Error updating status:', error);
      }
  }

  const updateSelectedSource = (field: keyof Source, value: any) => {
    if (selectedSource) {
      const updatedSource = { ...selectedSource, [field]: value };
      setSelectedSource(updatedSource);
      setSources(sources.map(s => s.id === selectedSource.id ? updatedSource : s));
    }
  };

  const updateSelectedAudioTemplate = (field: keyof AudioTemplate, value: any) => {
    if (selectedAudioTemplate) {
      const updatedTemplate = { ...selectedAudioTemplate, [field]: value };
      setSelectedAudioTemplate(updatedTemplate);
      setAudioTemplates(audioTemplates.map(temp => temp.id === selectedAudioTemplate.id ? updatedTemplate : temp));
    }
  };

  const updateSelectedVideoTemplate = (field: keyof LinearTemplate, value: any) => {
    if (selectedVideoTemplate) {
      const updatedTemplate = { ...selectedVideoTemplate, [field]: value };
      setSelectedVideoTemplate(updatedTemplate);
      setVideoTemplates(videoTemplates.map(temp => temp.id === selectedVideoTemplate.id ? updatedTemplate : temp));
    }
  };

    const updateSelectedABRTemplate = (field: keyof ABRTemplate, value: any) => {
    if (selectedABRTemplate) {
      const updatedTemplate = { ...selectedABRTemplate, [field]: value };
      setSelectedABRTemplate(updatedTemplate);
      /*setAbrTemplates(abrTemplates.map(temp => temp.id === selectedABRTemplate.id ? updatedTemplate : temp));*/
    }
  };
  

  const filteredSources = sources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.ingestRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.ingestType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAudioTemplates = audioTemplates.filter(template =>
    template.audioOutputCodec?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVideoTemplates = videoTemplates.filter(template =>
    template.videoOutputCodec?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredABRTemplates = abrTemplates.filter(template =>
    template.videoOutputCodec?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDestinations = destinations.filter(destination =>
    destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.cloudDeliveryRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.deliveryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedSources = [...filteredSources].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof Source];
    const bValue = b[sortField as keyof Source];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedAudioTemplates = [...filteredAudioTemplates].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof AudioTemplate];
    const bValue = b[sortField as keyof AudioTemplate];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedVideoTemplates = [...filteredVideoTemplates].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof LinearTemplate];
    const bValue = b[sortField as keyof LinearTemplate];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedABRTemplates = [...filteredABRTemplates].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof ABRTemplate];
    const bValue = b[sortField as keyof ABRTemplate];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof Destination];
    const bValue = b[sortField as keyof Destination];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalSourcesPages = Math.ceil(sortedSources.length / itemsPerPage);
  const totalAudioTemplatesPages = Math.ceil(sortedAudioTemplates.length / itemsPerPage);
  const totalVideoTemplatesPages = Math.ceil(sortedVideoTemplates.length / itemsPerPage);
  const totalABRTemplatesPages = Math.ceil(sortedABRTemplates.length / itemsPerPage);
  const totalDestinationsPages = Math.ceil(sortedDestinations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSources = sortedSources.slice(startIndex, startIndex + itemsPerPage);
  const paginatedAudioTemplates = sortedAudioTemplates.slice(startIndex, startIndex + itemsPerPage);
  const paginatedVideoTemplates = sortedVideoTemplates.slice(startIndex, startIndex + itemsPerPage);
  const paginatedABRTemplates = sortedABRTemplates.slice(startIndex, startIndex + itemsPerPage);
  const paginatedDestinations = sortedDestinations.slice(startIndex, startIndex + itemsPerPage);

  const handleAddSource = async () => {
  const sourceData = {
    name: newSource.name,
    resourceId: newSource.resourceId,
    ingestType: newSource.ingestType,
    connectionString: newSource.connectionString,
    encryptionSettings: newSource.encryptionSettings,
    passphrase: newSource.passphrase,
    latency: newSource.latency,
  };

  

  try {
    const response = await addSource(sourceData);
    const data = response.data;

    if (data.status === 'success') {
      console.log('Source added successfully:', data);
      setShowAddSourceDialog(false);
      setNewSource({
        name: '',
        lineupId: '',
        resourceId: "",
        sourceId: "",
        sourceName: "",
        lineupStatus: 'Deactive',
        ingestType: '',
        ingestRegion: '',
        alarmStatus: '',
        connectionString: '',
        encryptionSettings: 'Disabled',
        passphrase: '',
        latency: 0
      })
      loadSources(); // reload the updated list of sources
    } else {
      console.error('Failed to add source:', data.errorMessage || data);
    }
  } catch (error) {
    console.error('Error while adding source:', error);
  }
};


const handleAddDestination = async () => {
  if (!selectedSourceIdForDestination || !newDestination.resourceId || !newDestination.name) {
    alert("Please select a source, resource and enter a destination name.");
    return;
  }

  const selectedSource = sources.find(src => src.id === selectedSourceIdForDestination);

  let selectedTemplate = null
  if (transcodingEnabled && selectedTemplateId) {
    selectedTemplate = videoTemplates.find(temp => temp.id === selectedTemplateId)
                      || audioTemplates.find(temp => temp.id === selectedTemplateId)
                      || abrTemplates.find(temp => temp.id === selectedTemplateId);
  }

  if (!selectedSource) {
    console.error("Source not found");
    return;
  }


   const payload = {
    destinationName: newDestination.name,
    source: selectedSource,
    resourceId: newDestination.resourceId,
    template: (transcodingEnabled && selectedTemplate) ? selectedTemplate : "None"
  };

  try {
    const response = await addDestination(payload);
    const data = response.data;
    console.log("data", data)
    if (data.status === 'success') {

      let sourceId, templateId, destinationId;

      if (data.ids.length === 3) {
        [sourceId, templateId, destinationId] = data.ids;
      } else if (data.ids.length === 2) {
        [sourceId, destinationId] = data.ids;
        templateId = null;
      }

      if (sourceId && destinationId) {
        const newLink = {
          sourceId,
          templateId,
          destinationId
        };

        console.log("Linked IDs:", newLink);

        setLinkMap(prev => [...prev, newLink]);
      }
      setShowAddDestinationDialog(false);
      loadDestinations()
      loadLinkMap()
      setNewDestination({
        id: '',
        name: '',
        lineupId: '',
        resourceId: "",
        deliveryType: '',
        address: '',
        cloudDeliveryRegion: '',
        connectionStatus: "",
        alarmStatus: ""
      }) 
      setSelectedSourceForDestination("")
      setTranscodingEnabled(false)
      setselectedTemplateId("")

      setTimeout(() => {
        console.log('Reloading sources and destinations after activation...');
        loadSources();        
        loadDestinations(); 
      }, 4000);
    } else {
      console.error('Error:', data.errorMessage || 'Unknown error');
      alert(`Error: ${data.errorMessage}`);
    }
  } catch (error) {
    console.error('Request failed:', error);
    alert('Failed to add destination.');
  }
};

const handleAddLinearTemplate = async () => {
  const videoTemplateData = {
    name: newVideoTemplate.name,
    videoOutputCodec: newVideoTemplate.videoOutputCodec,
    hResolution: newVideoTemplate.hResolution,
    vResolution: newVideoTemplate.vResolution,
    frameRate: newVideoTemplate.frameRate,
  };

  try {
    const response = await addLinearTemplate(videoTemplateData);
    const data = response.data;

    if (data.status === 'success') {
      alert('Linear template added successfully:');
      setShowAddVideoTemplateDialog(false);
      setNewVideoTemplate({
    id: '',
    name: '',
    type: 'linear',
    videoOutputCodec: '',
    hResolution: '',
    vResolution: '',
    frameRate: '',
})
      
      loadVideoTemplates();
    } else {
      console.error('Failed to add video template:', data.errorMessage || data);
      alert(`Add video template request failed: ${data.errorMessage}`);
    }
  } catch (error) {
    console.error('Error while adding video template:', error);
    alert(`Error while adding video template: ${error}`);
  }
};

const handleAddAudioTemplate = async () => {
  const audioTemplateData = {
    name: newAudioTemplate.name,
    audioOutputCodec: newAudioTemplate.audioOutputCodec,
    bitrate: newAudioTemplate.bitrate,
  };

  try {
    const response = await addAudioTemplate(audioTemplateData);
    const data = response.data;

    if (data.status === 'success') {
      alert('Audio template added successfully:');
      setShowAddAudioTemplateDialog(false);
      setNewAudioTemplate({
    id: '',
    name: '',
    type: 'audio',
    audioOutputCodec: '',
    bitrate: '',
})
      
      loadAudioTemplates();
    } else {
      console.error('Failed to add audio template:', data.errorMessage || data);
      alert(`Add audio template request failed: ${data.errorMessage}`);
    }
  } catch (error) {
    console.error('Error while adding audio template:', error);
    alert(`Error while adding audio template: ${error}`);
  }
};


  const handleDeleteSource = async (id: string, lineupId: string) => {
  if (window.confirm('Are you sure you want to delete this source?')) {
    try {
      const delSourceData = {
          id: id, 
          lineupId: lineupId
        }
        const response = await delSource(delSourceData)  
        const data = response.data;
        if (data.status === 'success') {
          alert('Source deleted successfully');
          loadSources();
        }
        else {
          console.error(data.errorMessage); 
          alert(`Delete failed: ${data.errorMessage}`); 
        }       
      } catch (error) {
        console.error(error);
        alert('Delete request failed.');
      }
    }
};

const handleDeleteDestination = async (id: string, lineupId: string) => {
  if (window.confirm('Are you sure you want to delete this destination?')) {
    try {
        const delDestData = {
          id: id, 
          lineupId: lineupId
        }
        const response = await delDestination(delDestData)  
        const data = response.data;
        if (data.status === 'success') {
          alert('Destination deleted successfully');
          loadDestinations();
        }
        else {
          console.error(data.errorMessage); 
          alert(`Delete failed: ${data.errorMessage}`); 
        }       
      } catch (error) {
        console.error(error);
        alert('Delete request failed.');
      }
    }
};

  const handleDeleteAudioTemplate = async (templateId: string) => {
  if (window.confirm('Are you sure you want to delete this audio template?')) {
    try {
        const response = await delAudioTemplate(templateId)  
        const data = response.data;
        if (data.status === 'success') {
          alert('Audio template deleted successfully');
          loadAudioTemplates();
        }
        else {
          console.error(data.errorMessage); 
          alert(`Delete failed: ${data.errorMessage}`); 
        }       
      } catch (error) {
        console.error(error);
        alert('Delete request failed.');
      }
    }
};

  const handleDeleteVideoTemplate = async (templateId: string) => {
  if (window.confirm('Are you sure you want to delete this video template?')) {
    try {
        const response = await delLinearTemplate(templateId)  
        const data = response.data;
        if (data.status === 'success') {
          alert('Linear template deleted successfully');
          loadVideoTemplates();
        }
        else {
          console.error(data.errorMessage); 
          alert(`Delete failed: ${data.errorMessage}`); 
        }       
      } catch (error) {
        console.error(error);
        alert('Delete request failed.');
      }
    }
};

  const handleNextFromAddSource = () => {
    setShowAddSourceDialog(false);
    setShowConfigDialog(true);
  };

  const handleSave = async (selectedSource: Source) => {
  try {
    const response = await updateSource(selectedSource)
    const result = response.data;

    if (result.status === 'success') {
      alert('Source updated successfully');
      setShowConfigDialog(false);  // Close dialog on success
      loadSources()
    } else {
      alert('Failed to update source: ' + result.errorMessage);
    }
  } catch (error) {
    console.error('Error updating source:', error);
    alert('Error updating source: Fill all the fields');
  }
};

const handleEditLinearTemplate = async (template: LinearTemplate) => {
  try {
    const editLinearData = {
        name: template.name,
        videoOutputCodec: template.videoOutputCodec,
        hResolution: template.hResolution,
        vResolution: template.vResolution,
        frameRate: template.frameRate
      }

    const response = await updateLinearTemplate(editLinearData, template.id)
    const result = response.data;

    if (result.status === 'success') {
      alert('Linear template updated successfully');
      setEditVideoTemplateDialog(false); 
      loadVideoTemplates(); 
    } else {
      alert('Failed to update template: ' + result.errorMessage);
    }
  } catch (error) {
    console.error('Error updating template:', error);
    alert('Error connecting to backend');
  }
};

const handleEditAudioTemplate = async (template: AudioTemplate) => {
  try {
    const editAudioData = {
        name: template.name,
        audioOutputCodec: template.audioOutputCodec,
        bitrate: template.bitrate
      }

    const response = await updateAudioTemplate(editAudioData, template.id)
    const result = response.data;

    if (result.status === 'success') {
      alert('Audio template updated successfully');
      setEditAudioTemplateDialog(false); 
      loadAudioTemplates(); 
    } else {
      alert('Failed to update template: ' + result.errorMessage);
    }
  } catch (error) {
    console.error('Error updating template:', error);
    alert('Error connecting to backend');
  }
};

  const renderSourcesContent = () => (
    <div className="space-y-6">
      {/* Sources Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Video className="w-8 h-8 text-yellow-500" />
        <h2 className="text-3xl font-bold text-gray-900">Sources</h2>
      </div>

      {/* Search and Add Source */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddSourceDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add a Source</span>
        </button>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { key: 'name', label: 'Name' },
                  { key: 'lineupStatus', label: 'Lineup Status' },
                  { key: 'ingestType', label: 'Ingest Type' },
                  { key: 'ingestRegion', label: 'Ingest Region' },
                  { key: 'status', label: 'Status' },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key as keyof Source)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortField === column.key && (
                        sortDirection === 'asc' ? 
                        <ChevronUp className="w-3 h-3" /> : 
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <Filter className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"/>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSources.map((source) => (
                <tr 
                  key={source.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(source)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {source.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        source.lineupStatus === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.lineupStatus}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {source.ingestType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {source.ingestRegion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        source.alarmStatus === 'None'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {source.alarmStatus}
                    </button>
                  </td>

                  {/* Delete button column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                    onClick={(e) => {
                    e.stopPropagation(); 
                    handleDeleteSource(source.id, source.lineupId);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Source"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedSources.length)} of {sortedSources.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalSourcesPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalSourcesPages, currentPage + 1))}
              disabled={currentPage === totalSourcesPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div>
      <MapComponent/>
      </div>
    </div>
  );

  
  const renderTemplatesContent = () => (
    <div className="space-y-6">
      {/* Templates Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Book className="w-8 h-8 text-yellow-500" />
        <h2 className="text-3xl font-bold text-gray-900">Transcoding Templates</h2>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
          />
        </div>
      </div>


      {/* Templates Grid */}
      <div>
      <div className="flex justify-between items-center mb-4">
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'video' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('video')}
        >
          Video Templates
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'audio' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio Templates
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'ABR' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('ABR')}
        >
          ABR Templates
        </button>
      </div>

      {/* Add Button */}
      <button
      className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
      onClick={() => {activeTab === 'audio' ? setShowAddAudioTemplateDialog(true) : activeTab === 'video' ? setShowAddVideoTemplateDialog(true) : setShowAddABRTemplateDialog(true)}}
      >
      <Plus className="w-4 h-4" />
      <span>
        {activeTab === 'audio' ? 'Add Audio Template' : activeTab === 'video' ? 'Add Video Template' : 'Add ABR Template'}
      </span>
      </button>
      </div>

      {activeTab === 'video' && (
        <>
        <table className="w-full border">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: 'name', label: 'Name' },
                { key: 'Destination', label: 'Used by destination' },
                { key: 'videoOutputCodec', label: 'Video Codec' },
                { key: 'resolution', label: 'Resolution' },
                { key: 'frameRate', label: 'Frame Rate' },
              ].map((column) => (
              <th
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort(column.key as keyof LinearTemplate)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortField === column.key && (
                    sortDirection === 'asc' ?
                    <ChevronUp className="w-3 h-3" /> :
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <Filter className="w-3 h-3 text-gray-400" />
                </div>
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"/>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVideoTemplates.map((template) => {
                  const link = linkMap.find(
                    (link) => link.templateId === template.name
                  );
                  const destinationName = destinations.find((dst) => dst.id === link?.destinationId)?.name || "Unlinked";
                return (
                <tr 
                  key={template.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVideoTemplateRowClick(template)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destinationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.videoOutputCodec}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.hResolution}x{template.vResolution}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.frameRate}
                  </td>
                  {/* Delete button column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                    onClick={(e) => {
                    e.stopPropagation(); 
                    handleDeleteVideoTemplate(template.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Source"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
               )})}
            </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedVideoTemplates.length)} of {sortedVideoTemplates.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalVideoTemplatesPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalVideoTemplatesPages, currentPage + 1))}
              disabled={currentPage === totalVideoTemplatesPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        </>
      )}

      {activeTab === 'audio' && (
        <>
        <table className="w-full border">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: 'name', label: 'Name' },
                { key: 'Destination', label: 'Used by destination' },
                { key: 'audioOutputCodec', label: 'Audio Codec' },
                { key: 'bitrate', label: 'Bitrate' },
              ].map((column) => (
              <th
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort(column.key as keyof AudioTemplate)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortField === column.key && (
                    sortDirection === 'asc' ?
                    <ChevronUp className="w-3 h-3" /> :
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <Filter className="w-3 h-3 text-gray-400" />
                </div>
             </th>
             ))}
             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"/>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAudioTemplates.map((template) => {
                const link = linkMap.find(
                  (link) => link.templateId === template.name
                );
                const destinationName = destinations.find((dst) => dst.id === link?.destinationId)?.name || "Unlinked";

                return (
                <tr 
                  key={template.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAudioTemplateRowClick(template)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destinationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.audioOutputCodec}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.bitrate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                    onClick={(e) => {
                    e.stopPropagation(); 
                    handleDeleteAudioTemplate(template.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Source"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedAudioTemplates.length)} of {sortedAudioTemplates.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalAudioTemplatesPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalAudioTemplatesPages, currentPage + 1))}
              disabled={currentPage === totalAudioTemplatesPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        </>
      )}

      {activeTab === 'ABR' && (
        <>
        <table className="w-full border">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: 'name', label: 'Name' },
                { key: 'Destination', label: 'Used by destination' },
                { key: 'videoOutputCodec', label: 'Video Codec' },
                { key: 'resolution', label: 'Resolution' },
                { key: 'frameRate', label: 'Frame Rate' },
              ].map((column) => (
              <th
              key={column.key}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort(column.key as keyof ABRTemplate)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortField === column.key && (
                    sortDirection === 'asc' ?
                    <ChevronUp className="w-3 h-3" /> :
                    <ChevronDown className="w-3 h-3" />
                  )}
                  <Filter className="w-3 h-3 text-gray-400" />
                </div>
              </th>
            ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
              {videoTemplates.map((template) => {
                  const link = linkMap.find(
                    (link) => link.templateId === template.name
                  );
                  const destinationName = destinations.find((dst) => dst.id === link?.destinationId)?.name || "Unlinked";
                return (
                <tr 
                  key={template.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleVideoTemplateRowClick(template)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destinationName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.videoOutputCodec}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.hResolution}x{template.vResolution}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {template.frameRate}
                  </td>
                </tr>
               )})}
            </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedABRTemplates.length)} of {sortedABRTemplates.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalABRTemplatesPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalABRTemplatesPages, currentPage + 1))}
              disabled={currentPage === totalABRTemplatesPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        </>
      )}

      </div>
    </div>
  );

  const renderDestinationsContent = () => (
    <div className="space-y-6">
      {/* Destinations Header */}
      <div className="flex items-center space-x-3 mb-6">
        <CloudDownload className="w-8 h-8 text-yellow-500" />
        <h2 className="text-3xl font-bold text-gray-900">Destinations</h2>
      </div>

      {/* Search and Add Destination */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddDestinationDialog(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Destinations</span>
        </button>
      </div>

      {/* Destinations Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { key: 'name', label: 'Destinations Name(s)' },
                  { key: 'cloudDeliveryRegion', label: 'Cloud Delivery Region' },
                  { key: 'deliveryType', label: 'Delivery Type' },
                  { key: 'address', label: 'Address'},
                  { key: 'connectionStatus', label: 'Connection Status' }
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.key as keyof Destination)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortField === column.key && (
                        sortDirection === 'asc' ? 
                        <ChevronUp className="w-3 h-3" /> : 
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <Filter className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"/>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDestinations.map((destination) => (
                <tr key={destination.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {destination.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destination.cloudDeliveryRegion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destination.deliveryType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {destination.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        destination.connectionStatus === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {destination.connectionStatus}
                    </button>
                  </td>

                  {/* Delete button column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                    onClick={(e) => {
                    e.stopPropagation(); 
                    handleDeleteDestination(destination.id, destination.lineupId);
                    }}
                    className="text-red-500 hover:text-red-700"
                    title="Delete Destination"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedDestinations.length)} of {sortedDestinations.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalDestinationsPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalDestinationsPages, currentPage + 1))}
              disabled={currentPage === totalDestinationsPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <div>
      <MapComponent/>
      </div>
    </div>
  );

  const renderDashboardContent = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Total Sources</p>
              <p className="text-2xl font-bold text-white">{sources.length}</p>
            </div>
            <Database className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Active Sources
              </p>
              <p className="text-2xl font-bold text-white">
                {sources.filter(src => src.lineupStatus === "Active").length}
              </p>
            </div>
            <Database className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Total Destinations
              </p>
              <p className="text-2xl font-bold text-white">
                {destinations.length}
              </p>
            </div>
            <CloudDownload className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Active Destinations
              </p>
              <p className="text-2xl font-bold text-white">
                {destinations.filter(dest => dest.connectionStatus === "Active").length}
              </p>
            </div>
            <CloudDownload className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

        {/* Configuration Section */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {/* Left Side - Sources List */}
            <div className="lg:col-span-1">
              <h4 className="text-m font-bold text-white mb-4 uppercase tracking-wide">Sources</h4>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSource(source)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedSource?.id === source.id
                        ? 'border-yellow-500 bg-gray-900/20 shadow-lg shadow-yellow-500/20'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <h5 className="text-sm font-medium text-white">
                        {source.name}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Connection Visualization */}
            <div className="lg:col-span-5">
              <div className="bg-gray-900 rounded-lg p-6 h-[600px] relative overflow-auto hover-scroll">
                {selectedSource ? (
                  <div key={animationKey} className="h-full relative">
                    {/* Connection Diagram */}
                    <div className="flex justify-between items-center w-full gap-8 px-10 z-10 relative">
                      {/* Source Card */}
                      <div className="w-56 max-w-48">
                        <div className="light-yellow rounded-lg p-2 text-black shadow-xl">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full animate-pulse ${
                                    selectedSource.lineupStatus === 'Active' ? 'bg-green-800' : 'bg-red-800'
                                  }`}></div>
                              {selectedSource.alarmStatus !== "None" && (
                              <div title={selectedSource.alarmStatus} className="relative group z-10">
                                <AlertTriangle
                                  ref={referenceRef}
                                  onClick={() => loadMessages(selectedSource.lineupId)}
                                  className={`w-5 h-5 z-10 animate-pulse cursor-pointer ${
                                  selectedSource.alarmStatus === 'MAJOR' ? 'text-red-500' : 'text-orange-500'
                                  }`}
                                  fill={selectedSource.alarmStatus === 'MAJOR' ? 'red' : 'orange'}
                                  stroke="white"
                                />
                                {showAlarmTooltip && selectedAlarmLineupId === selectedSource.lineupId && (
                                  <div ref={popperRef} style={styles.popper} {...attributes.popper} className="absolute mb-1 bg-gray-900 border border-gray-300 text-white text-sm rounded shadow-lg z-50 p-2 w-64">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr>
                                          <th className="border-b pb-1">Message Code</th>
                                          <th className="border-b pb-1">Message Text</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {messages.map((msg, index) => (
                                          <tr key={index}>
                                            <td className="py-1">{msg.severity}</td>
                                            <td className="py-1">{msg.messageText}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                              )}

                              <span className="text-sm font-medium">Source</span>
                            </div>
                            <span className={`text-sm font-bold bg-white/20 px-2 py-1 rounded ${
                              selectedSource.lineupStatus === "Active" ? 'bg-green-150 text-green-800' : 'bg-red-150 text-red-800'
                            }`}>
                              {selectedSource.lineupStatus}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-3">{selectedSource.name}</h3>
                          
                          <div className="space-y-1 text-sm">
                            <div><span className="font-bold">IP:</span>  {selectedSource.connectionString}</div>
                            <div><span className="font-bold">Region:</span>  {selectedSource.ingestRegion}</div>
                            <div><span className="font-bold">Type:</span>  {selectedSource.ingestType}</div>
                            <div><span className="font-bold">DCM:</span> {
                            resources.find(resrc => resrc.id === selectedSource.resourceId)?.name || "N/A"
                            }
                            </div>
                            <div><span className="font-bold">DCM State: </span>
                              <span className={`text-sm font-bold bg-white/20 px-1 py- rounded ${
                              appState === "Ready" ? 'bg-green-150 text-green-800' : 'bg-red-150 text-red-800'
                            }`}>
                              {appState || "Loading..."}
                            </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Destination Cards */}
                      <div className="flex flex-col gap-3 max-h-full">
                        {getRelatedDestinations(selectedSource).map(({ destination, template }) => (
                          <div key={destination.id} className=" w-50 max-w-56">
                            <div className="dark-yellow rounded-lg p-3 text-gray shadow-xl h-full text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                                    destination.connectionStatus === 'Active' ? 'bg-green-800' : 'bg-red-800'
                                  }`}></div>
                                  {destination.alarmStatus !== "None" && (
                                    <div title={destination.alarmStatus} className="relative group z-10">
                                      <AlertTriangle
                                        
                                        onClick={() => loadMessages(destination.lineupId)}
                                        className={`w-5 h-5 z-10 animate-pulse cursor-pointer ${
                                        destination.alarmStatus === 'MAJOR' ? 'text-red-500' : 'text-orange-500'
                                        }`}
                                        fill={destination.alarmStatus === 'MAJOR' ? 'red' : 'orange'}
                                        stroke="white"
                                      />

                                      {showAlarmTooltip && selectedAlarmLineupId === destination.lineupId && (
                                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/4 bg-gray-900 border border-gray-300 text-white text-sm rounded shadow-lg z-50 p-2 w-64">
                                      <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr>
                                          <th className="border-b pb-1">Message Code</th>
                                          <th className="border-b pb-1">Message Text</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {messages.map((msg, index) => (
                                          <tr key={index}>
                                            <td className="py-1">{msg.severity}</td>
                                            <td className="py-1">{msg.messageText}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                    </div>
                                  )}
                                <span className="font-medium">Destination</span>
                                </div>
                                <span className={`text-sm font-bold bg-white/20 px-1 py-1 rounded ${
                                 destination.connectionStatus === "Active" ? 'bg-green-150 text-green-800' : 'bg-red-150 text-red-800'
                                }`}>
                                  {destination.connectionStatus}
                                </span>
                              </div>
                              
                              <h3 className="text-xl font-bold mb-1">{destination.name}</h3>
                              
                              <div className="space-y-1">
                                  <div><span className="font-bold">IP:</span>  {destination.address}</div>
                                  <div><span className="font-bold">Region:</span>  {destination.cloudDeliveryRegion}</div>
                                  <div><span className="font-bold">Type:</span>  {destination.deliveryType}</div>
                                  <div><span className="font-bold">DCM:</span>  {
                                  resources.find(resrc => resrc.id === destination.resourceId)?.name || "N/A"
                                  }
                                  </div>
                                  <div><span className="font-bold">DCM State: </span>
                                    <span className={`text-sm font-bold bg-white/20 px-1 py- rounded ${
                                      appState === "Ready" ? 'bg-green-150 text-green-800' : 'bg-red-150 text-red-800'
                                    }`}>
                                      {appState || "Loading..."}
                                    </span>
                                  </div>
                                  <div className="w-56 truncate whitespace-nowrap overflow-hiddenl" title={template || "N/A"}>
                                    <span className="font-bold">Template:</span> {template == null ? "N/A" : template}
                                  </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Connection Lines */}
                      <svg className="absolute inset-0 w-full h-full z-0">
                        {getRelatedDestinations(selectedSource).map(({ destination, template }, index) => {
                          const color = destination.connectionStatus === 'Active' && selectedSource.lineupStatus === 'Active' ? '#10b981' : '#ff0000';
                          
                          const relatedDestinations = getRelatedDestinations(selectedSource);
                          const destinationCount = relatedDestinations.length;
                          const sourceY = (destinationCount*100 + 10) + (index * 5);
                          const destY = 110 + (index * 200); 
                          
                          /*
                          if(destinationCount == 4){
                            sourceY = 410 + (index * 5);
                            destY = 110 + (index * 200); 
                          }else if(destinationCount == 3){
                            sourceY = 310 + (index * 5);
                            destY = 110 + (index * 200); 
                          }
                            else if(destinationCount == 2){
                            sourceY = 210 + (index * 5);
                            destY = 110 + (index * 200); 
                          }
                            else if(destinationCount == 1){
                            sourceY = 110 + (index * 5);
                            destY = 110 + (index * 200); 
                          }
                           */                     

                          return (
                            <g key={destination.id}>
                              {/* Invisible connection line for tooltip */}
                              <line 
                                x1="240"
                                y1={sourceY}
                                x2="450"
                                y2={destY}
                                stroke="transparent"
                                strokeWidth="10"
                                className="cursor-pointer"
                                onMouseEnter={(e) => {
                                  const clickX = e.clientX; 
                                  const clickY = e.clientY - 10;

                                  const lineartemp = videoTemplates.find(temp => temp.name === template)
                                  const audiotemp = audioTemplates.find(temp => temp.name === template)
                                  setTooltipData({
                                    x: clickX,
                                    y: clickY,
                                    bitrate: audiotemp?.bitrate || "?",
                                    framerate: lineartemp?.frameRate || "?",
                                  });
                                }}
                                onMouseLeave={() => setTooltipData(null)}
                              />
                              
                              {/* Main visible connection line */}
                              <line 
                                x1="240"
                                y1={sourceY}
                                x2="450"
                                y2={destY}
                                stroke={color}
                                strokeWidth="3"
                                strokeDasharray="8,4"
                                className="opacity-80 pointer-events-none"
                              >
                                <animate
                                  attributeName="stroke-dashoffset"
                                  values="0;-12"
                                  dur="1s"
                                  repeatCount="indefinite"
                                  begin={`${index * 0.2}s`}
                                />
                              </line>
                              
                              {/* Animated data flow dots */}
                              <circle r="4" fill={color} className="opacity-90 pointer-events-none">
                                <animateMotion
                                  dur="2s"
                                  repeatCount="indefinite"
                                  begin={`${index * 0.2}s`}
                                >
                                  <mpath href={`#path-${index}`} />
                                </animateMotion>
                              </circle>
                              
                              {/* Hidden path for animation */}
                              <path
                                id={`path-${index}`}
                                d={`M 240 ${sourceY} L 450 ${destY}`}
                                fill="none"
                                stroke="none"
                                className="pointer-events-none"
                              />
                            </g>
                          );
                        })}
                      </svg>
                      {tooltipData && (
                        <div
                          className="fixed z-50 bg-black text-white text-xs p-2 rounded shadow-lg"
                          style={{
                            top: tooltipData.y,
                            left: tooltipData.x,
                            transform: "translate(-50%, -100%)",
                            pointerEvents: "none",
                          }}
                        >
                          <div>
                            <strong>cur:</strong> {tooltipData.bitrate}&nbsp;
                            <strong>avg:</strong> {tooltipData.bitrate}&nbsp;
                            <strong>min:</strong> {tooltipData.bitrate}&nbsp;
                            <strong>max:</strong> {tooltipData.bitrate} Mbps
                          </div>
                          <div><strong>framerate:</strong> {tooltipData.framerate}</div>
                      </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Radio className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg text-gray">Select a source to view connections</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>   
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 h-16 flex items-center px-2 relative z-50">
        <div className="flex items-center space-x-4 ">
          {/* Synamedia Logo */}
          <div className="flex items-center space-x-5">
            <img src={logo} alt="Logo" height={180} width={180}/>  
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-400"></div>


          {/* Header Title */}
          <h1 className={'text-2xl font-semibold text-yellow-400'}>
            Quortex 
          </h1>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-50 bg-white min-h-screen shadow-lg">
          <div className="p-6">
            {/* Tree View Header */}
            <div className="mb-6">
              <button
                onClick={() => setTreeExpanded(!treeExpanded)}
                className="flex items-center space-x-2 text-gray-800 hover:text-gray-600 transition-colors duration-200"
              >
                <span className="font-bold text-lg">My Pool</span>
                {treeExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Tree View Items */}
            {treeExpanded && (
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setSelectedSidebarItem(item.name);
                      setCurrentPage(1);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      selectedSidebarItem === item.name
                        ? 'bg-yellow-50 border-l-4 border-yellow-400'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <item.icon 
                      className={`w-5 h-5 ${
                        selectedSidebarItem === item.name ? 'text-yellow-500' : 'text-gray-600'
                      }`} 
                    />
                    <span 
                      className={`font-bold ${
                        selectedSidebarItem === item.name ? 'text-black' : 'text-black'
                      }`}
                    >
                      {item.name}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 p-8 ${selectedSidebarItem === "Dashboard" ? "bg-black" : "bg-gray-100"}`}>
          <div className="max-w-7xl mx-auto">
            {selectedSidebarItem === 'Sources' && renderSourcesContent()}
            {selectedSidebarItem === 'Templates' && renderTemplatesContent()}
            {selectedSidebarItem === 'Destinations' && renderDestinationsContent()}
            {!['Sources', 'Templates', 'Destinations'].includes(selectedSidebarItem) && renderDashboardContent()}
          </div>
        </main>
      </div>

      {/* Configuration Dialog */}
      {showConfigDialog && selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Configuration</h3>
              <button
                onClick={() => setShowConfigDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex h-[900px]">
              {/* Left Sidebar */}
              <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-yellow-400 rounded-full"></div>
                  <span className="font-semibold text-yellow-600">Ingest Point</span>
                </div>
              </div>
              
              {/* Right Panel */}
              <div className="flex-1 p-6">
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={selectedSource.name}
                      onChange={(e) => updateSelectedSource('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    />
                  </div>


                  
                  {/* Lineup Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lineup Status</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleActiveDeactive(selectedSource)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          selectedSource.lineupStatus === 'Active' ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            selectedSource.lineupStatus === 'Active' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-700">{selectedSource.lineupStatus}</span>
                    </div>
                  </div>
                  
                  {/* Connection Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Connection Type</label>
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer space-x-2">
                        <input
                          type="radio"
                          name="connectionType"
                          value="SRT Listener"
                          checked={selectedSource.ingestType === 'SRT Listener'}
                          onChange={(e) => updateSelectedSource('ingestType', e.target.value)}
                          className="peer hidden"
                        />
                        <div className="h-4 w-4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                          <div className={`h-2 w-2 rounded-full ${
                            selectedSource.ingestType === 'SRT Listener' ? 'bg-yellow-500' : 'bg-white'}`}></div>
                        </div>
                        <span className="text-sm text-gray-700">SRT Listener</span>
                      </label>
                      <label className="flex items-center cursor-pointer space-x-2">
                        <input
                          type="radio"
                          name="connectionType"
                          value="SRT Caller"
                          checked={selectedSource.ingestType === 'SRT Caller'}
                          onChange={(e) => updateSelectedSource('ingestType', e.target.value)}
                          className="peer hidden"
                        />
                        <div className="h-4 w-4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                          <div className={`h-2 w-2 rounded-full ${
                          selectedSource.ingestType === 'SRT Caller' ? 'bg-yellow-500' : 'bg-white'}`}></div>
                        </div>
                        <span className="text-sm text-gray-700">SRT Caller</span>
                      </label>
                    </div>
                  </div>
              
                  {/* Ingest Region */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingest Region</label>
                    <div className="space-y-2">
                      <button
                      className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}
                    >
                      {selectedSource.ingestRegion}
                    </button>
                    </div>
                    </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status (If any alarms)</label>
                    <div className="space-y-2">
                      <button
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSource.alarmStatus === 'None'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedSource.alarmStatus}
                    </button>
                    </div>
                  </div>
                  
                  {/* Connection String */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={selectedSource.connectionString}
                        onChange={(e) => updateSelectedSource('connectionString', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                      />
                      <button
                        onClick={() => handleCopy(selectedSource.connectionString, 'connectionString')}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        {copiedField === 'connectionString' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Encryption Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Settings</label>
                    <select
                    value={selectedSource.encryptionSettings}
                    onChange={(e) => updateSelectedSource('encryptionSettings', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                  >

                    <option value="Disabled">Disabled</option>
                    <option value="128">AES 128</option>
                    <option value="192">AES 192</option>
                    <option value="256">AES 256</option>
                    </select>
                  </div>
                  
                  {/* Conditionally show Encryption Mode and Passphrase */}
                  {selectedSource.encryptionSettings !== "Disabled" && (
                    <>                    
                    {/* Passphrase Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Passphrase</label>
                      <input
                      type="password"
                      value={selectedSource.passphrase}
                      onChange={(e) => updateSelectedSource('passphrase', e.target.value)}
                      placeholder="Enter passphrase"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                      />
                      {/* Validation message */}
                      {selectedSource.passphrase && selectedSource.passphrase.length <= 10 && (
                        <p className="mt-1 text-sm text-red-600">Passphrase must be longer than 10 characters.</p>
                      )}
                    </div>
                  </>
                  )}

                  
                  {/* Latency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latency</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={selectedSource.latency}
                        onChange={(e) => updateSelectedSource('latency', parseInt(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                      />
                      <span className="text-sm text-gray-500">ms</span>
                    </div>
                  </div>
                  <div className="flex justify-end p-4">
                    <button 
                    onClick={() => handleSave(selectedSource)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded-lg transition duration-200">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Dialog */}

      {showAddSourceDialog && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Add a Source</h3>
        <button onClick={() => setShowAddSourceDialog(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {addSourceStep === 1 ? (
          <>
            {/* Step 1: Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                placeholder="Enter source name"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a resource</label>
                <select
                  value={newSource.resourceId}
                  onChange={(e) => setNewSource({ ...newSource, resourceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a resource --</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingest Type</label>
              <div className="space-y-2">
                      <label className="flex items-center cursor-pointer space-x-2">
                        <input
                          type="radio"
                          name="connectionType"
                          value="SRT Listener"
                          checked={newSource.ingestType === 'SRT Listener'}
                          onChange={(e) => setNewSource({...newSource, ingestType: e.target.value})}
                          className="peer hidden"
                        />
                        <div className="h-4 w-4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                          <div className={`h-2 w-2 rounded-full ${newSource.ingestType === 'SRT Listener' ? 'bg-yellow-500' : 'bg-white'}`}></div>
                        </div>
                        <span className="text-m text-gray-700">SRT Listener</span>
                      </label>
                      <label className="flex items-center cursor-pointer space-x-2">
                        <input
                          type="radio"
                          name="connectionType"
                          value="SRT Caller"
                          checked={newSource.ingestType === 'SRT Caller'}
                          onChange={(e) => setNewSource({...newSource, ingestType: e.target.value})}
                          className="peer hidden"
                        />
                        <div className="h-4 w-4 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                          <div className={`h-2 w-2 rounded-full ${newSource.ingestType === 'SRT Caller' ? 'bg-yellow-500' : 'bg-white'}`}></div>
                        </div>
                        <span className="text-m text-gray-700">SRT Caller</span>
                      </label>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection String</label>
              <input
                type="text"
                value={newSource.connectionString}
                onChange={(e) => setNewSource({ ...newSource, connectionString: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                placeholder="Enter connection string"
              />
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Security Settings */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Settings</label>
              <select
                value={newSource.encryptionSettings}
                onChange={(e) => setNewSource({ ...newSource, encryptionSettings: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
              >
                <option value="Disabled">Disabled</option>
                <option value="128">AES-128</option>
                <option value="256">AES-256</option>
                <option value="192">AES-192</option>
              </select>
            </div>

            {/* Conditionally show passphrase */}
            {newSource.encryptionSettings !== "Disabled" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passphrase</label>
                <input
                  type="password"
                  value={newSource.passphrase}
                  onChange={(e) =>
                    setNewSource({ ...newSource, passphrase: e.target.value })
                  }
                  className={`w-full px-3 py-2 border ${
                    newSource.passphrase.length <= 10 ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none`}
                  placeholder="Enter passphrase"
                />
                {newSource.passphrase.length <= 10 && (
                  <p className="text-red-500 text-sm mt-1">Passphrase must be longer than 10 characters.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latency (ms)</label>
              <input
                type="number"
                value={newSource.latency}
                onChange={(e) =>
                  setNewSource({ ...newSource, latency: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                placeholder="e.g., 200"
              />
            </div>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <button
          onClick={() => addSourceStep === 1 ? setShowAddSourceDialog(false) : setAddSourceStep(1)}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {addSourceStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        {addSourceStep === 1 ? (
          <button
            onClick={() => setAddSourceStep(2)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleAddSource}
            disabled={newSource.encryptionSettings !== "Disabled" && newSource.passphrase.length <= 10}
            className={`px-4 py-2 rounded-lg text-white ${
              newSource.encryptionSettings !== "Disabled" && newSource.passphrase.length <= 10
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  </div>
)}


      {/* Add Destination Dialog */}
      {showAddDestinationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Setup your destinations</h3>
              <button
                onClick={() => setShowAddDestinationDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">

              {/* Choose Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a source</label>
                <select
                  value={selectedSourceIdForDestination}
                  onChange={(e) => setSelectedSourceForDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a source --</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a resource</label>
                <select
                  value={newDestination.resourceId}
                  onChange={(e) => setNewDestination({ ...newDestination, resourceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a resource --</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Configuration Container */}
              <div className="border-2 border-gray-200 rounded-lg p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination name</label>
                  <input
                    type="text"
                    value={newDestination.name}
                    onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter destination name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transcoding template</label>
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={() => setTranscodingEnabled(!transcodingEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        transcodingEnabled ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          transcodingEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {transcodingEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {transcodingEnabled && (
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setselectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    >
                      <option value="">-- Select a template --</option>
                        <optgroup label="Video Templates">
                          {videoTemplates
                          .map((temp) => (
                            <option key={temp.id} value={temp.id}>
                              {temp.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Audio Templates">
                          {audioTemplates
                          .filter((temp) => temp.type === 'audio')
                          .map((temp) => (
                            <option key={temp.id} value={temp.id}>
                              {temp.name}
                            </option>
                          ))}
                        </optgroup>
                    </select>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-3"> 
                <button
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add a Destination</span>
                </button>               
                <button
                  onClick={handleAddDestination}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddAudioTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {activeTab === 'audio' ? 'Add Audio Template' : 'Add Video Template'}
              </h3>
              <button
                onClick={() => setShowAddAudioTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={newAudioTemplate.name}
                    onChange={(e) => setNewAudioTemplate({ ...newAudioTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={newAudioTemplate.audioOutputCodec}
                  onChange={(e) => setNewAudioTemplate({ ...newAudioTemplate, audioOutputCodec: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="AAC_LC">AAC-LC</option>
                  <option value="MPEG-L2">MPEG-L2</option>
                  <option value="HE-AAC v1">HE-AAC v1</option>
                  <option value="HE-AAC v2">HE-AAC v2</option>
                  <option value="Dolby Digital">Dolby Digital</option>
                  <option value="Dolby Digital Plus">Dolby Digital Plus</option>
                  <option value="Dolby AC-4">Dolby AC-4</option>
                  <option value="Passthrough">Passthrough</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bitrate</label>
                  <input
                    type="number"
                    value={newAudioTemplate.bitrate}
                    onChange={(e) => setNewAudioTemplate({ ...newAudioTemplate, bitrate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="0"
                  />
              </div>
              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  onClick={handleAddAudioTemplate}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

     {showAddVideoTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {activeTab === 'audio' ? 'Add Audio Template' : 'Add Video Template'}
              </h3>
              <button
                onClick={() => setShowAddVideoTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={newVideoTemplate.name}
                    onChange={(e) => setNewVideoTemplate({ ...newVideoTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={newVideoTemplate.videoOutputCodec}
                  onChange={(e) => setNewVideoTemplate({ ...newVideoTemplate, videoOutputCodec: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="MPEG2">MPEG2</option>
                  <option value="H.264">H.264</option>
                  <option value="H.265">H.265</option>
                </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">H-Resolution</label>
                  <select
                  value={newVideoTemplate.hResolution}
                  onChange={(e) => setNewVideoTemplate({ ...newVideoTemplate, hResolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select hResolution --</option>
                   <option value="640">640</option>
                   <option value="960">960</option>
                   <option value="1280">1280</option>
                   <option value="1440">1440</option>
                   <option value="1920">1920</option>
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">V-Resolution</label>
                  <select
                  value={newVideoTemplate.vResolution}
                  onChange={(e) => setNewVideoTemplate({ ...newVideoTemplate, vResolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select vResolution --</option>
                   <option value="720">720p</option>
                   <option value="1080">1080i</option>
                   <option value="1080">1080p</option>
                  </select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frame rate</label>
                  <select
                  value={newVideoTemplate.frameRate}
                  onChange={(e) => setNewVideoTemplate({ ...newVideoTemplate, frameRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select frame rate --</option>
                   <option value="25">25</option>
                   <option value="29.97">29.97</option>
                   <option value="30">30</option>
                  </select>
                </div>

              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  onClick={handleAddLinearTemplate}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

      {showAddABRTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Add ABR Template
              </h3>
              <button
                onClick={() => setShowAddABRTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={newABRTemplate.name}
                    onChange={(e) => setNewABRTemplate({ ...newABRTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={newABRTemplate.videoOutputCodec}
                  onChange={(e) => setNewABRTemplate({ ...newABRTemplate, videoOutputCodec: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="MPEG2">MPEG2</option>
                  <option value="H.264">H.264</option>
                  <option value="H.265">H.265</option>
                </select>
              </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <input
                    type="text"
                    value={newABRTemplate.resolution}
                    onChange={(e) => setNewABRTemplate({ ...newABRTemplate, resolution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="1920x1080"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frame rate</label>
                  <input
                    type="number"
                    value={newABRTemplate.frameRate}
                    onChange={(e) => setNewABRTemplate({ ...newABRTemplate, frameRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="0"
                  />
                </div>

              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

     {editAudioTemplateDialog && selectedAudioTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {activeTab === 'audio' ? 'Edit Audio Template' : 'Edit Video Template'}
              </h3>
              <button
                onClick={() => setEditAudioTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={selectedAudioTemplate.name}
                    onChange={(e) => updateSelectedAudioTemplate('name', e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={selectedAudioTemplate.audioOutputCodec}
                  onChange={(e) => updateSelectedAudioTemplate('audioOutputCodec', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="AAC_LC">AAC-LC</option>
                  <option value="MPEG-L2">MPEG-L2</option>
                  <option value="HE-AAC v1">HE-AAC v1</option>
                  <option value="HE-AAC v2">HE-AAC v2</option>
                  <option value="Dolby Digital">Dolby Digital</option>
                  <option value="Dolby Digital Plus">Dolby Digital Plus</option>
                  <option value="Dolby AC-4">Dolby AC-4</option>
                  <option value="Passthrough">Passthrough</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bitrate</label>
                  <input
                    type="number"
                    value={selectedAudioTemplate.bitrate}
                    onChange={(e) => updateSelectedAudioTemplate("bitrate", e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="0"
                  />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  onClick={() => handleEditAudioTemplate(selectedAudioTemplate)}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

     {editVideoTemplateDialog && selectedVideoTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {activeTab === 'audio' ? 'Edit Audio Template' : 'Edit Video Template'}
              </h3>
              <button
                onClick={() => setEditVideoTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={selectedVideoTemplate.name}
                    onChange={(e) => updateSelectedVideoTemplate('name', e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={selectedVideoTemplate.videoOutputCodec}
                  onChange={(e) => updateSelectedVideoTemplate('videoOutputCodec', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="MPEG2">MPEG2</option>
                  <option value="H.264">H.264</option>
                  <option value="H.265">H.265</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">H-Resolution</label>
                  <select
                  value={selectedVideoTemplate.hResolution}
                  onChange={(e) => updateSelectedVideoTemplate('hResolution', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                   <option value="640">640</option>
                   <option value="960">960</option>
                   <option value="1280">1280</option>
                   <option value="1440">1440</option>
                   <option value="1920">1920</option>
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">V-Resolution</label>
                  <select
                  value={selectedVideoTemplate.vResolution}
                  onChange={(e) => updateSelectedVideoTemplate('vResolution', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                   <option value="720">720p</option>
                   <option value="1080">1080i</option>
                   <option value="1080">1080p</option>
                  </select>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frame rate</label>
                  <select
                  value={selectedVideoTemplate.frameRate}
                  onChange={(e) => updateSelectedVideoTemplate('frameRate', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                   <option value="25">25</option>
                   <option value="29.97">29.97</option>
                   <option value="30">30</option>
                  </select>
                </div>

              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  onClick={() => handleEditLinearTemplate(selectedVideoTemplate)}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

      {editABRTemplateDialog && selectedABRTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit ABR Template
              </h3>
              <button
                onClick={() => setEditABRTemplateDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template name</label>
                  <input
                    type="text"
                    value={selectedABRTemplate.name}
                    onChange={(e) => updateSelectedABRTemplate('name', e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose a codec</label>
                <select
                  value={selectedABRTemplate.videoOutputCodec}
                  onChange={(e) => updateSelectedABRTemplate('videoOutputCodec', e.target.value )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                >
                  <option value="">-- Select a codec --</option>
                  <option value="MPEG2">MPEG2</option>
                  <option value="H.264">H.264</option>
                  <option value="H.265">H.265</option>
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <input
                    type="text"
                    value={selectedABRTemplate.hResolution}
                    onChange={(e) => updateSelectedABRTemplate('hResolution', e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="1920x1080"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frame rate</label>
                  <input
                    type="number"
                    value={selectedABRTemplate.frameRate}
                    onChange={(e) => updateSelectedABRTemplate('frameRate', e.target.value )}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent focus-visible:outline-none"
                    placeholder="0"
                  />
                </div>

              {/* Action Buttons */}
              <div className="space-y-3">               
                <button
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
     )}

      {/* Overlay for dropdown */}
      {logoDropdownOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setLogoDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default App;