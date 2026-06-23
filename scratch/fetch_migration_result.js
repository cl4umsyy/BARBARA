async function main() {
  console.log("Fetching migration API...");
  try {
    const res = await fetch("https://barbara-jade.vercel.app/api/migrate");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response body:");
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
