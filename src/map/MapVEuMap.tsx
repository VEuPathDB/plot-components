import React, {
  useState,
  CSSProperties,
  ReactElement,
  cloneElement,
} from 'react';
import { BoundsViewport, AnimationFunction } from './Types';
import { BoundsDriftMarkerProps } from './BoundsDriftMarker';
const { BaseLayer } = LayersControl;
import { Viewport, Map, TileLayer, LayersControl } from 'react-leaflet';
import SemanticMarkers from './SemanticMarkers';
import 'leaflet/dist/leaflet.css';
import '../styles/map_styles.css';
import CustomGridLayer from './CustomGridLayer';
import MouseTools, { MouseMode } from './MouseTools';

/**
 * Renders a Leaflet map with semantic zooming markers
 *
 *
 * @param props
 */

export interface MapVEuMapProps {
  /** Center lat/long and zoom level */
  viewport: Viewport;

  /** Height and width of plot element */
  height: CSSProperties['height'];
  width: CSSProperties['width'];
  onViewportChanged: (bvp: BoundsViewport) => void;
  markers: ReactElement<BoundsDriftMarkerProps>[];
  recenterMarkers?: boolean;
  //DKDK add this for closing sidebar at MapVEuMap: passing setSidebarCollapsed()
  sidebarOnClose?: (value: React.SetStateAction<boolean>) => void;
  animation: {
    method: string;
    duration: number;
    animationFunction: AnimationFunction;
  } | null;
  showGrid: boolean;
  showMouseToolbar?: boolean;
}

export default function MapVEuMap({
  viewport,
  height,
  width,
  onViewportChanged,
  markers,
  animation,
  recenterMarkers = true,
  showGrid,
  showMouseToolbar,
}: MapVEuMapProps) {
  // this is the React Map component's onViewPortChanged handler
  // we may not need to use it.
  // onViewportchanged in SemanticMarkers is more relevant
  // because it can access the map's bounding box (aka bounds)
  // which is useful for fetching data to show on the map.
  // The Viewport info (center and zoom) handled here would be useful for saving a
  // 'bookmarkable' state of the map.
  const [state, updateState] = useState<Viewport>(viewport as Viewport);
  const [mouseMode, setMouseMode] = useState<MouseMode>('default');
  // Whether the user is currently dragging the map
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const handleViewportChanged = (viewport: Viewport) => {
    updateState(viewport);
  };

  // BM: Why doesn't this work when wrapped in useEffect()?
  // useEffect(() => {
  // Show popups if we're in magnification mouse mode and we're not dragging.
  // Dragging messes with our popup implementation.
  if (mouseMode === 'magnification' && !isDragging) {
    markers = markers.map((marker) =>
      cloneElement(marker, { showPopup: true })
    );
  }
  //  }, [ markers, isDragging, mouseMode ]);

  return (
    <Map
      viewport={state}
      style={{ height, width }}
      onViewportChanged={handleViewportChanged}
      className={mouseMode === 'magnification' ? 'cursor-zoom-in' : ''}
      // DKDK testing worldmap issue: minZomm needs to be 2 (FHD) or 3 (4K): set to be 2
      minZoom={2}
      worldCopyJump={false}
      ondragstart={() => setIsDragging(true)}
      ondragend={() => setIsDragging(false)}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />

      <SemanticMarkers
        onViewportChanged={onViewportChanged}
        markers={markers}
        animation={animation}
        recenterMarkers={recenterMarkers}
      />

      {showMouseToolbar && (
        <MouseTools mouseMode={mouseMode} setMouseMode={setMouseMode} />
      )}

      {showGrid ? <CustomGridLayer /> : null}

      <LayersControl position="topright">
        <BaseLayer checked name="street">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012"
          />
        </BaseLayer>
        <BaseLayer name="terrain">
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}"
            attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            subdomains="abcd"
            // minZoom='0'
            // maxZoom='18'
            // ext='png'
          />
        </BaseLayer>
        <BaseLayer name="satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            // DKDK testing worldmap issue - with bounds props, message like 'map data not yet availalbe' is not shown
            bounds={[
              [-90, -180],
              [90, 180],
            ]}
            noWrap={true}
          />
        </BaseLayer>
        <BaseLayer name="light">
          <TileLayer
            url="http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            // maxZoom='18'
          />
        </BaseLayer>
        <BaseLayer name="dark">
          <TileLayer
            url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            subdomains="abcd"
            // maxZoom='19'
          />
        </BaseLayer>
        <BaseLayer name="OSM">
          <TileLayer
            url="http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
            // minZoom='2'
            // maxZoom='18'
            // noWrap='0'
          />
        </BaseLayer>
      </LayersControl>
    </Map>
  );
}
