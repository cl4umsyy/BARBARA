async function main() {
  console.log("Fetching migrate API...");
  try {
    const res = await fetch("https://barbara-jade.vercel.app/api/migrate?secret=barbara_migrate_2026");
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
