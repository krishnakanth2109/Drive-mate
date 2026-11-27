import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface Coord {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Driver {
  lat: number;
  lng: number;
  heading?: number;
  vehicleType?: string;
}

interface Props {
  center: Coord;
  googleMapsKey?: string | null;
  zoom?: number;
  markers?: { coord: Coord; color: string; label: string }[];
  routeCoords?: RoutePoint[];
  driverLocation?: Coord | null;
  nearbyDrivers?: { [id: string]: Driver };
  onRegionChange?: (lat: number, lng: number) => void;
  isPinPicking?: boolean;
  showTraffic?: boolean;
  surgeMultiplier?: number;
  style?: any;
}

export default function WebMapView({
  center,
  googleMapsKey,
  zoom = 15,
  markers = [],
  routeCoords = [],
  driverLocation,
  nearbyDrivers = {},
  onRegionChange,
  isPinPicking = false,
  showTraffic = true,
  surgeMultiplier = 1.0,
  style,
}: Props) {
  const [useFallbackMap, setUseFallbackMap] = useState(!googleMapsKey);

  useEffect(() => {
    if (!googleMapsKey) {
      setUseFallbackMap(true);
    }
  }, [googleMapsKey]);

  const safeLat = center?.latitude ?? 17.385;
  const safeLng = center?.longitude ?? 78.4867;
  const markersJson = JSON.stringify(markers);
  const routeJson = JSON.stringify(routeCoords);
  const driverJson = JSON.stringify(driverLocation);
  const nearbyJson = JSON.stringify(nearbyDrivers);

  const googleMapsHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .pin-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-100%); font-size:36px; z-index:9999; pointer-events:none; }
  </style>
</head>
<body>
<div id="map"></div>
${isPinPicking ? '<div class="pin-center">📍</div>' : ''}
<script>
  let map, userMarker;

  window.gm_authFailure = function() {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'GM_AUTH_FAILURE' }));
    }
  };

  function initMap() {
    const center = { lat: ${safeLat}, lng: ${safeLng} };
    map = new google.maps.Map(document.getElementById('map'), {
      center,
      zoom: ${zoom},
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    });

    userMarker = new google.maps.Marker({
      position: center,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#007AFF',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2.5,
      },
      title: 'Current Location',
    });

    const markersData = ${markersJson};
    markersData.forEach(m => {
      new google.maps.Marker({
        position: { lat: m.coord.latitude, lng: m.coord.longitude },
        map,
        label: { text: m.label, color: 'white', fontWeight: 'bold', fontSize: '11px' },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: m.color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });
    });

    ${showTraffic ? `
    if (google.maps.TrafficLayer) {
      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);
    }
    ` : ''}

    ${surgeMultiplier > 1.04 ? `
    new google.maps.Circle({
      strokeColor: '#f72585',
      strokeOpacity: 0.35,
      strokeWeight: 1.5,
      fillColor: '#f72585',
      fillOpacity: 0.08,
      map,
      center,
      radius: 900,
    });
    ` : ''}

    const route = ${routeJson};
    if (route.length > 1) {
      const poly = new google.maps.Polyline({
        path: route.map(p => ({ lat: p.latitude, lng: p.longitude })),
        geodesic: true,
        strokeColor: '#f72585',
        strokeOpacity: 0.95,
        strokeWeight: 6,
        map,
      });
      const bounds = new google.maps.LatLngBounds();
      route.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, { top: 120, right: 40, bottom: 340, left: 40 });
    }

    const driver = ${driverJson};
    if (driver) {
      new google.maps.Marker({
        position: { lat: driver.latitude, lng: driver.longitude },
        map,
        label: { text: '🏍️', fontSize: '24px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
      });
    }

    const nearby = ${nearbyJson};
    const vehicleEmoji = { bike:'🏍️', scooty:'🛵', auto:'🛺', car:'🚗' };
    Object.values(nearby).forEach(d => {
      const emoji = vehicleEmoji[d.vehicleType] || '🏍️';
      new google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map,
        label: { text: emoji, fontSize: '20px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
      });
    });

    ${isPinPicking ? `
    map.addListener('idle', () => {
      const c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PIN', lat: c.lat(), lng: c.lng() }));
    });
    ` : ''}
  }
</script>
<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&callback=initMap">
</script>
</body>
</html>`;

  const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
    .pin-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-100%); font-size:36px; z-index:9999; pointer-events:none; }
    .marker-label { border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.3); }
    .from-label { background:#06d6a0; color:white; }
    .to-label { background:#f72585; color:white; }
  </style>
</head>
<body>
<div id="map"></div>
${isPinPicking ? '<div class="pin-center">📍</div>' : ''}
<script>
  const map = L.map('map', { zoomControl:false, attributionControl:false })
    .setView([${safeLat}, ${safeLng}], ${zoom});
  const voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom:19 });
  voyagerLayer.on('tileerror', () => {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);
  });
  voyagerLayer.addTo(map);

  ${surgeMultiplier > 1.04 ? `
  L.circle([${safeLat}, ${safeLng}], {
    color: '#f72585',
    weight: 1.5,
    opacity: 0.45,
    fillColor: '#f72585',
    fillOpacity: 0.08,
    radius: 850
  }).addTo(map);
  ` : ''}

  const userIcon = L.divIcon({
    html:'<div style="width:18px;height:18px;border-radius:50%;background:#4361ee;border:3px solid white;box-shadow:0 0 12px rgba(67,97,238,0.65)"></div>',
    iconSize:[18,18],
    iconAnchor:[9,9],
    className:''
  });
  L.marker([${safeLat}, ${safeLng}], { icon:userIcon }).addTo(map);

  const markersData = ${markersJson};
  markersData.forEach(m => {
    const cls = m.label === 'FROM' ? 'from-label' : 'to-label';
    const icon = L.divIcon({ html:'<span class="marker-label '+cls+'">'+m.label+'</span>', className:'', iconAnchor:[20,12] });
    L.marker([m.coord.latitude, m.coord.longitude], { icon }).addTo(map);
  });

  const route = ${routeJson};
  if (route.length > 1) {
    const poly = L.polyline(route.map(p => [p.latitude, p.longitude]), { color:'#f72585', weight:6, opacity:0.95 }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding:[70, 70], maxZoom: 16 });
  }

  const driver = ${driverJson};
  if (driver) {
    const dIcon = L.divIcon({ html:'<span style="font-size:24px">🏍️</span>', className:'', iconSize:[28,28], iconAnchor:[14,14] });
    L.marker([driver.latitude, driver.longitude], { icon:dIcon }).addTo(map);
  }

  const nearby = ${nearbyJson};
  const vehicleEmoji = { bike:'🏍️', scooty:'🛵', auto:'🛺', car:'🚗' };
  Object.values(nearby).forEach(d => {
    const emoji = vehicleEmoji[d.vehicleType] || '🏍️';
    const dIcon = L.divIcon({ html:'<span style="font-size:22px;display:block;transform:rotate('+(d.heading||0)+'deg)">'+emoji+'</span>', className:'', iconSize:[28,28], iconAnchor:[14,14] });
    L.marker([d.lat, d.lng], { icon:dIcon }).addTo(map);
  });

  ${isPinPicking ? `map.on('moveend', () => { const c = map.getCenter(); window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PIN', lat: c.lat, lng: c.lng })); });` : ''}
</script>
</body>
</html>`;

  const html = !useFallbackMap && googleMapsKey ? googleMapsHtml : fallbackHtml;

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={`${useFallbackMap ? 'fallback' : googleMapsKey}-${showTraffic}-${surgeMultiplier.toFixed(1)}-${markers.length}-${routeCoords.length}-${safeLat}-${safeLng}`}
        source={{ html, baseUrl: 'https://localhost' }}
        originWhitelist={['*']}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data.type === 'GM_AUTH_FAILURE') {
              console.warn('Google Maps JS auth failed; switching to Leaflet map fallback');
              setUseFallbackMap(true);
            } else if ((data.type === 'PIN' || data.lat != null) && onRegionChange) {
              onRegionChange(data.lat, data.lng);
            }
          } catch (_) {}
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#f72585" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#f0f2f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
});
