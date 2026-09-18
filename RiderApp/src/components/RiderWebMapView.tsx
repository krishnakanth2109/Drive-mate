import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface Coord {
  latitude: number;
  longitude: number;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface Props {
  center: Coord;
  googleMapsKey?: string | null;
  zoom?: number;
  pickupCoord?: { lat: number; lng: number } | null;
  dropCoord?: { lat: number; lng: number } | null;
  routeCoords?: RoutePoint[];
  style?: any;
}

export default function RiderWebMapView({
  center,
  googleMapsKey,
  zoom = 15,
  pickupCoord,
  dropCoord,
  routeCoords = [],
  style,
}: Props) {
  const routeJson = JSON.stringify(routeCoords);

  const googleMapsHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  let map;
  function initMap() {
    const center = { lat: ${center.latitude}, lng: ${center.longitude} };
    map = new google.maps.Map(document.getElementById('map'), {
      center,
      zoom: ${zoom},
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Rider location (blue dot)
    new google.maps.Marker({
      position: center,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
      title: 'Rider',
    });

    // Pickup marker
    ${pickupCoord ? `
    new google.maps.Marker({
      position: { lat: ${pickupCoord.lat}, lng: ${pickupCoord.lng} },
      map,
      label: { text: 'FROM', color: 'white', fontWeight: 'bold', fontSize: '11px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#06d6a0',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });
    ` : ''}

    // Drop marker
    ${dropCoord ? `
    new google.maps.Marker({
      position: { lat: ${dropCoord.lat}, lng: ${dropCoord.lng} },
      map,
      label: { text: 'TO', color: 'white', fontWeight: 'bold', fontSize: '11px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#f72585',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });
    ` : ''}

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
    .marker-label { background:white; border-radius:6px; padding:2px 7px; font-size:11px; font-weight:bold; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.25); }
    .from-label { background:#06d6a0; color:white; }
    .to-label { background:#f72585; color:white; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl:true, attributionControl:false })
    .setView([${center.latitude}, ${center.longitude}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);
  const riderIcon = L.divIcon({ html:'<div style="width:14px;height:14px;border-radius:50%;background:#4285f4;border:3px solid white;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>', iconSize:[14,14], iconAnchor:[7,7], className:'' });
  L.marker([${center.latitude}, ${center.longitude}], { icon:riderIcon }).addTo(map);
  ${pickupCoord ? `
  const fromIcon = L.divIcon({ html:'<span class="marker-label from-label">FROM</span>', className:'', iconAnchor:[20,12] });
  L.marker([${pickupCoord.lat}, ${pickupCoord.lng}], { icon:fromIcon }).addTo(map);
  ` : ''}
  ${dropCoord ? `
  const toIcon = L.divIcon({ html:'<span class="marker-label to-label">TO</span>', className:'', iconAnchor:[14,12] });
  L.marker([${dropCoord.lat}, ${dropCoord.lng}], { icon:toIcon }).addTo(map);
  ` : ''}
  const route = ${routeJson};
  if (route.length > 1) {
    const poly = L.polyline(route.map(p => [p.latitude, p.longitude]), { color:'#f72585', weight:5 }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding:[60,60] });
  }
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
