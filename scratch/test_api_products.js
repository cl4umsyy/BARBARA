async function main() {
  try {
    console.log("Fetching http://localhost:3000/api/products...");
    const res = await fetch("http://localhost:3000/api/products");
    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Products in API response:");
    if (data.products) {
      data.products.forEach(p => {
        console.log(`- ID: ${p.id}, Slug: ${p.slug}, Name: ${p.name}`);
      });
    } else {
      console.log("No products key:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
