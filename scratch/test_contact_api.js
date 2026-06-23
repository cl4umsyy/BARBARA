async function test() {
  try {
    // 1. Test GET /api/contact
    const getRes = await fetch("http://127.0.0.1:3000/api/contact");
    const getInfo = await getRes.json();
    console.log("GET /api/contact Status:", getRes.status);
    console.log("Store Info:", JSON.stringify(getInfo, null, 2));

    // 2. Test POST /api/contact/messages
    const payload = {
      name: "Budi Santoso",
      email: "budi@example.com",
      subject: "Tanya Stok Jaket",
      message: "Halo, apakah Denim Jacket ukuran L ready stock?"
    };

    console.log("Sending POST inquiry...");
    const postRes = await fetch("http://127.0.0.1:3000/api/contact/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const postResult = await postRes.json();
    console.log("POST /api/contact/messages Status:", postRes.status);
    console.log("Result:", JSON.stringify(postResult, null, 2));

  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
