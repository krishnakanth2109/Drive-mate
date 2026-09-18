import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Coord {
  latitude: number;
  longitude: number;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface Driver {
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
  style,
}: Props) {
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
    .pin-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-100%); font-size:34px; z-index:9999; pointer-events:none; }
  </style>
</head>
<body>
<div id="map"></div>
${isPinPicking ? '<div class="pin-center">📍</div>' : ''}
<script>
  let map, userMarker;

  function initMap() {
    const center = { lat: ${center.latitude}, lng: ${center.longitude} };
    map = new google.maps.Map(document.getElementById('map'), {
      center,
      zoom: ${zoom},
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // User location (blue dot style)
    userMarker = new google.maps.Marker({
      position: center,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
      title: 'You',
    });

    // Named markers (FROM / TO)
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

    // Route polyline
    const route = ${routeJson};
    if (route.length > 1) {
      const poly = new google.maps.Polyline({
        path: route.map(p => ({ lat: p.latitude, lng: p.longitude })),
        geodesic: true,
        strokeColor: '#f72585',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });
      const bounds = new google.maps.LatLngBounds();
      route.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, { top:80, right:40, bottom:300, left:40 });
    }

    // Active driver
    const driver = ${driverJson};
    if (driver) {
      new google.maps.Marker({
        position: { lat: driver.latitude, lng: driver.longitude },
        map,
        label: { text: '🏍️', fontSize: '22px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0 },
      });
    }

    // Nearby drivers
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

    // Pin picking: report center on drag end
    ${isPinPicking ? `
    map.addListener('idle', () => {
      const c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat(), lng: c.lng() }));
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
    .pin-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-100%); font-size:34px; z-index:9999; pointer-events:none; }
    .marker-label { background:white; border-radius:6px; padding:2px 7px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.25); }
    .from-label { background:#06d6a0; color:white; }
    .to-label { background:#f72585; color:white; }
  </style>
</head>
<body>
<div id="map"></div>
${isPinPicking ? '<div class="pin-center">📍</div>' : ''}
<script>
  const map = L.map('map', { zoomControl:true, attributionControl:false })
    .setView([${center.latitude}, ${center.longitude}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);
  const userIcon = L.divIcon({ html:'<div style="width:14px;height:14px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>', iconSize:[14,14], iconAnchor:[7,7], className:'' });
  L.marker([${center.latitude}, ${center.longitude}], { icon:userIcon }).addTo(map);
  const markersData = ${markersJson};
  markersData.forEach(m => {
    const cls = m.label === 'FROM' ? 'from-label' : 'to-label';
    const icon = L.divIcon({ html:'<span class="marker-label '+cls+'">'+m.label+'</span>', className:'', iconAnchor:[20,12] });
    L.marker([m.coord.latitude, m.coord.longitude], { icon }).addTo(map);
  });
  const route = ${routeJson};
  if (route.length > 1) {
    const poly = L.polyline(route.map(p => [p.latitude, p.longitude]), { color:'#f72585', weight:5 }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding:[40,40] });
  }
  const driver = ${driverJson};
  if (driver) {
    const dIcon = L.divIcon({ html:'<span style="font-size:22px">🏍️</span>', className:'', iconSize:[28,28], iconAnchor:[14,14] });
    L.marker([driver.latitude, driver.longitude], { icon:dIcon }).addTo(map);
  }
  const nearby = ${nearbyJson};
  const vehicleEmoji = { bike:'🏍️', scooty:'🛵', auto:'🛺', car:'🚗' };
  Object.values(nearby).forEach(d => {
    const emoji = vehicleEmoji[d.vehicleType] || '🏍️';
    const dIcon = L.divIcon({ html:'<span style="font-size:20px;display:block;transform:rotate('+(d.heading||0)+'deg)">'+emoji+'</span>', className:'', iconSize:[28,28], iconAnchor:[14,14] });
    L.marker([d.lat, d.lng], { icon:dIcon }).addTo(map);
  });
  ${isPinPicking ? `map.on('moveend', () => { const c = map.getCenter(); window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng })); });` : ''}
</script>
</body>
</html>`;

  const html = googleMapsKey ? googleMapsHtml : fallbackHtml;

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={googleMapsKey || 'fallback'}
        source={{ html, baseUrl: 'https://localhost' }}
        originWhitelist={['*']}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          if (onRegionChange) {
            try {
              const { lat, lng } = JSON.parse(e.nativeEvent.data);
              onRegionChange(lat, lng);
            } catch (_) {}
          }
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#4285f4" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#e8e8e8' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e8e8e8' },
});
