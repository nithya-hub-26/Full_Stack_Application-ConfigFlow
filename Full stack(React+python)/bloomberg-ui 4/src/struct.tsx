export interface Source {
  id: string;
  lineupId: string;
  resourceId: string;
  sourceId: string;
  sourceName: string;
  name: string;
  lineupStatus: 'Active' | 'Deactive';
  ingestType: 'SRT Caller' | 'SRT Listener';
  ingestRegion: string;
  alarmStatus: string;
  connectionString: string;
  encryptionSettings: string;
  passphrase: string;
  latency: number;
}

export interface Destination {
  id: string;
  name: string;
  lineupId: string;
  resourceId: string;
  cloudDeliveryRegion: string;
  deliveryType: 'SRT Caller' | 'SRT Listener';
  address: string;
  connectionStatus: 'Active' | 'Deactive';
  alarmStatus: string;
}

export interface AudioTemplate {
  id: string;
  name: string;
  type: 'audio';
  audioOutputCodec: string;
  bitrate: string;
}

export interface LinearTemplate {
  id: string;
  name: string;
  type: 'linear';
  videoOutputCodec: string;
  hResolution: string;
  vResolution: string;
  frameRate: string;
}

export interface ABRTemplate {
  id: string;
  name: string;
  type: 'ABR';
  videoOutputCodec: string;
  hResolution: string;
  vResolution: string;
  frameRate: string;
}

export interface ToolTip {
  x: number;
  y: number;
  bitrate: string;
  framerate: string;
}

export type Link = {
  sourceId: string;
  destinationId: string;
  templateId: string | null;
};

export type Resource = {
  id: string;
  name: string;
  restApiHost: string;
}

export type Message = {
  severity: string;
  messageText: string;
}