async function test() {
  const url = 'http://localhost:3000/api/products?category=kaos&sort=price-asc';
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('API Response Status:', res.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API Fetch failed:', error);
  }
}

test();
