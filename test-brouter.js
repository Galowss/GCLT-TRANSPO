
async function test() {
  const p1 = '120.28,14.82'; // Olongapo
  const p2 = '120.58,15.18'; // Angeles City (Clark)
  const resFast = await fetch(`https://brouter.de/brouter?lonlats=${p1}|${p2}&profile=car-fast&format=geojson`);
  const dataFast = await resFast.json();
  console.log('Fast route length:', dataFast.features[0].properties['track-length']);
  
  const resEco = await fetch(`https://brouter.de/brouter?lonlats=${p1}|${p2}&profile=car-eco&format=geojson`);
  const dataEco = await resEco.json();
  console.log('Eco route length:', dataEco.features[0].properties['track-length']);
}
test();
