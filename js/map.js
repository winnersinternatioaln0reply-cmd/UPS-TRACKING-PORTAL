(function () {
  const mapNode = document.getElementById('interactive-route-map');
  if (!mapNode || !window.L) return;

  const status = document.getElementById('route-map-status');
  const addressInput = document.getElementById('route-map-address');
  const locateButton = document.getElementById('route-map-locate');
  const searchButton = document.getElementById('route-map-search');
  const origin = [40.7282, -73.7910];
  const map = L.map(mapNode).setView(origin, 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(origin).addTo(map).bindPopup(
    'Origin Facility: Jericho Quadrangle, Jericho, NY 11753'
  );
  L.circle(origin, {radius: 250, color: '#9a6b00', fillOpacity: 0.08}).addTo(map);

  let destinationMarker = null;
  let routeLayer = null;

  function say(message) {
    status.textContent = message;
  }

  async function showDestination(lat, lon, label) {
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (routeLayer) map.removeLayer(routeLayer);

    destinationMarker = L.marker([lat, lon]).addTo(map)
      .bindPopup('Destination: ' + label);
    map.fitBounds(L.latLngBounds([origin, [lat, lon]]).pad(0.15));
    say('Calculating route from origin facility…');

    try {
      const url = 'https://router.project-osrm.org/route/v1/driving/' +
        origin[1] + ',' + origin[0] + ';' + lon + ',' + lat +
        '?overview=full&geometries=geojson';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing service unavailable');
      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || !data.routes.length) {
        throw new Error('No driving route found');
      }

      routeLayer = L.geoJSON(data.routes[0].geometry, {
        style: {color: '#b47b00', weight: 5, opacity: 0.85}
      }).addTo(map);
      map.fitBounds(routeLayer.getBounds().pad(0.12));
      const km = (data.routes[0].distance / 1000).toFixed(1);
      const mins = Math.round(data.routes[0].duration / 60);
      say('Active Route: approximately ' + km + ' km, estimated ' + mins +
        ' transit minutes by road.');
    } catch (error) {
      const straight = L.polyline([origin, [lat, lon]], {
        color: '#b47b00', weight: 4, dashArray: '8 8'
      }).addTo(map);
      routeLayer = L.layerGroup([straight]).addTo(map);
      say('Live road directions are temporarily unavailable. Displaying direct path vector.');
    }
  }

  locateButton.addEventListener('click', function () {
    if (!navigator.geolocation) {
      say('Location access is not supported by this browser. Enter a destination address instead.');
      return;
    }
    say('Requesting location permissions…');
    navigator.geolocation.getCurrentPosition(
      function (position) {
        showDestination(
          position.coords.latitude,
          position.coords.longitude,
          'Current device location'
        );
      },
      function () {
        say('Location access denied. Please enter a destination address manually.');
      },
      {enableHighAccuracy: false, timeout: 15000, maximumAge: 60000}
    );
  });

  searchButton.addEventListener('click', async function () {
    const address = addressInput.value.trim();
    if (!address) {
      say('Please enter a destination address.');
      return;
    }
    say('Searching tracking address database…');
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
        encodeURIComponent(address);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Address search unavailable');
      const results = await response.json();
      if (!results.length) {
        say('Address not found. Please include city, state, or postal code.');
        return;
      }
      showDestination(Number(results[0].lat), Number(results[0].lon), address);
    } catch (error) {
      say('Address lookup service is currently unavailable.');
    }
  });

  say('Use current device location or enter a destination address to load mapping data.');
  setTimeout(function () { map.invalidateSize(); }, 200);
})();
