const encoder = new TextEncoder();

async function makeToken(password) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("DARK-MODS-LOGIN")
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function loginPage(error = "") {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>DARK MODS SKiNZ</title>
      <style>
        body {
          background: #080808;
          color: white;
          font-family: Arial;
          text-align: center;
          padding-top: 100px;
        }
        h1 { color: red; }
        input, button {
          padding: 14px;
          margin: 10px;
          border-radius: 8px;
          border: none;
        }
        button {
          background: red;
          color: white;
        }
      </style>
    </head>
    <body>
      <h1>DARK MODS SKiNZ</h1>
      <h3>Enter Your Password</h3>
      <p style="color:red">${error}</p>
      <form method="POST" action="/login">
        <input type="password" name="password"
          placeholder="Enter password" required>
        <br>
        <button type="submit">LOGIN</button>
      </form>
    </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}

export default {
  async fetch(request, env) {
    const password = env.SITE_PASSWORD;

    if (!password) {
      return new Response("SITE_PASSWORD is not configured.", {
        status: 500
      });
    }

    const token = await makeToken(password);
    const cookie = request.headers.get("Cookie") || "";
    const loggedIn = cookie.includes("darkmods_session=" + token);

    if (new URL(request.url).pathname === "/login" &&
        request.method === "POST") {
      const form = await request.formData();
      const submitted = String(form.get("password") || "");

      if (submitted === password) {
        return new Response(null, {
          status: 303,
          headers: {
            "Location": "/",
            "Set-Cookie": `darkmods_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
          }
        });
      }

      return loginPage("Wrong password! Try again.");
    }

    if (!loggedIn) {
      return loginPage();
    }

    if (new URL(request.url).pathname === "/logout") {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/",
          "Set-Cookie": "darkmods_session=; HttpOnly; Secure; Path=/; Max-Age=0"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
