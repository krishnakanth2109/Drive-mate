import React, { useState, useEffect } from 'react';
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
  center?: Coord | null;
  googleMapsKey?: string | null;
  zoom?: number;
  pickupCoord?: { lat: number; lng: number } | null;
  dropCoord?: { lat: number; lng: number } | null;
  routeCoords?: RoutePoint[];
  showTraffic?: boolean;
  surgeMultiplier?: number;
  activeGeofenceTarget?: 'pickup' | 'drop' | null;
  isWithinGeofence?: boolean;
  style?: any;
}

export default function RiderWebMapView({
  center,
  googleMapsKey,
  zoom = 15,
  pickupCoord,
  dropCoord,
  routeCoords = [],
  showTraffic = true,
  surgeMultiplier = 1.0,
  activeGeofenceTarget = null,
  isWithinGeofence = false,
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
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
    });

    ${showTraffic ? `
    if (google.maps.TrafficLayer) {
      new google.maps.TrafficLayer().setMap(map);
    }
    ` : ''}

    ${surgeMultiplier > 1.04 ? `
    new google.maps.Circle({
      strokeColor: '#f72585',
      strokeOpacity: 0.4,
      strokeWeight: 1.5,
      fillColor: '#f72585',
      fillOpacity: 0.1,
      map,
      center,
      radius: 1000,
    });
    ` : ''}

    // Rider location (blue dot)
    new google.maps.Marker({
      position: center,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2.5,
      },
      title: 'Captain Location',
    });

    ${pickupCoord ? `
    new google.maps.Marker({
      position: { lat: ${pickupCoord.lat}, lng: ${pickupCoord.lng} },
      map,
      label: { text: 'FROM', color: 'white', fontWeight: 'bold', fontSize: '11px' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });
    ` : ''}

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

    ${activeGeofenceTarget === 'pickup' && pickupCoord ? `
    new google.maps.Circle({
      strokeColor: '${isWithinGeofence ? '#10b981' : '#3b82f6'}',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '${isWithinGeofence ? '#10b981' : '#3b82f6'}',
      fillOpacity: ${isWithinGeofence ? 0.24 : 0.14},
      map,
      center: { lat: ${pickupCoord.lat}, lng: ${pickupCoord.lng} },
      radius: 50,
    });
    ` : ''}

    ${activeGeofenceTarget === 'drop' && dropCoord ? `
    new google.maps.Circle({
      strokeColor: '${isWithinGeofence ? '#10b981' : '#f72585'}',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: '${isWithinGeofence ? '#10b981' : '#f72585'}',
      fillOpacity: ${isWithinGeofence ? 0.24 : 0.14},
      map,
      center: { lat: ${dropCoord.lat}, lng: ${dropCoord.lng} },
      radius: 50,
    });
    ` : ''}

    const route = ${routeJson};
    if (route.length > 1) {
      new google.maps.Polyline({
        path: route.map(p => ({ lat: p.latitude, lng: p.longitude })),
        geodesic: true,
        strokeColor: '#f72585',
        strokeOpacity: 0.92,
        strokeWeight: 5,
        map,
      });
      const bounds = new google.maps.LatLngBounds();
      route.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
      map.fitBounds(bounds, { top:110, right:40, bottom:320, left:40 });
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
    .marker-label { background:white; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:800; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.28); }
    .from-label { background:#10b981; color:white; }
    .to-label { background:#f72585; color:white; }
  </style>
</head>
<body>
<div id="map"></div>
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
    fillOpacity: 0.1,
    radius: 950
  }).addTo(map);
  ` : ''}

  const riderIcon = L.divIcon({
    html:'<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 10px rgba(37,99,235,0.65)"></div>',
    iconSize:[16,16],
    iconAnchor:[8,8],
    className:''
  });
  L.marker([${safeLat}, ${safeLng}], { icon:riderIcon }).addTo(map);
  ${pickupCoord ? `
  const fromIcon = L.divIcon({ html:'<span class="marker-label from-label">FROM</span>', className:'', iconAnchor:[20,12] });
  L.marker([${pickupCoord.lat}, ${pickupCoord.lng}], { icon:fromIcon }).addTo(map);
  ` : ''}
  ${dropCoord ? `
  const toIcon = L.divIcon({ html:'<span class="marker-label to-label">TO</span>', className:'', iconAnchor:[14,12] });
  L.marker([${dropCoord.lat}, ${dropCoord.lng}], { icon:toIcon }).addTo(map);
  ` : ''}
  ${activeGeofenceTarget === 'pickup' && pickupCoord ? `
  L.circle([${pickupCoord.lat}, ${pickupCoord.lng}], {
    color: '${isWithinGeofence ? '#10b981' : '#3b82f6'}',
    weight: 2,
    fillColor: '${isWithinGeofence ? '#10b981' : '#3b82f6'}',
    fillOpacity: ${isWithinGeofence ? 0.24 : 0.14},
    radius: 50
  }).addTo(map);
  ` : ''}
  ${activeGeofenceTarget === 'drop' && dropCoord ? `
  L.circle([${dropCoord.lat}, ${dropCoord.lng}], {
    color: '${isWithinGeofence ? '#10b981' : '#f72585'}',
    weight: 2,
    fillColor: '${isWithinGeofence ? '#10b981' : '#f72585'}',
    fillOpacity: ${isWithinGeofence ? 0.24 : 0.14},
    radius: 50
  }).addTo(map);
  ` : ''}
  const route = ${routeJson};
  if (route.length > 1) {
    const poly = L.polyline(route.map(p => [p.latitude, p.longitude]), { color:'#f72585', weight:5 }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding:[70,70] });
  }
</script>
</body>
</html>`;

  const html = !useFallbackMap && googleMapsKey ? googleMapsHtml : fallbackHtml;

  return (
    <View style={[styles.container, style]}>
      <WebView
        key={`${useFallbackMap ? 'fallback' : googleMapsKey}-${showTraffic}-${surgeMultiplier.toFixed(1)}-${routeCoords.length}-${activeGeofenceTarget || 'none'}-${isWithinGeofence}`}
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
              setUseFallbackMap(true);
            }
          } catch {}
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#e2e8f0' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
});
