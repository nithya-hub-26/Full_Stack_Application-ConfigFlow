import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';

const position: LatLngExpression = [51.505, -0.09]; // Example: London

const MapComponent: React.FC = () => {
  return (
    <>
    <MapContainer
      center={position}
      zoom={1}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  />
      <Marker position={position} >
        <Popup>
           <Popup>Europe</Popup>
        </Popup>
      </Marker>
    </MapContainer>
    </>
  );
};

export default MapComponent;
