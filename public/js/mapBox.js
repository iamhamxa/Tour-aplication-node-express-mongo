export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiaWlhbWhhbXhhIiwiYSI6ImNsMGYzMmIzdzBwMTQzbXByZXhuejF5eXkifQ.m1jwn32V8GeOjo0pjD89QQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/iiamhamxa/cl0h37il7001y14p9dzt607wm',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 1,
  });

  const bounds = new mapboxgl.LngLatBounds();
  // Array.from(locations).forEach((el) => console.log(el));
  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
