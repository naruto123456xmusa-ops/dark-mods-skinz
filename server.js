
function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(
    new RegExp("(?:^|;\\s*)" + name + "=([^;]*)")
  );
  return match ? match[1] : null;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let visitorId = getCookie(request, "darkmods_visitor");
    let newCookie = false;

    if (!visitorId || !/^[a-f0-9-]{36}$/i.test(visitorId)) {
      visitorId = crypto.randomUUID();
      newCookie = true;
    }

    const cookie = newCookie
      ? `darkmods_visitor=${visitorId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`
      : null;

    if (url.pathname === "/api/status") {
      const now = Math.floor(Date.now() / 1000);

      const result = await env.DB.prepare(
        `SELECT key_value, expires_at
         FROM keys
         WHERE visitor_id = ?
         AND expires_at > ?
         ORDER BY expires_at DESC
         LIMIT 1`
      ).bind(visitorId, now).first();

      return json({
        authorized: !!result,
        key: result ? result.key_value : null,
        expiresAt: result ? result.expires_at : null
      }, 200, cookie ? { "Set-Cookie": cookie } : {});
    }

    if (url.pathname === "/api/key") {
      return json({
        success: false,
        message: "Ad verification is not connected yet."
      }, 503, cookie ? { "Set-Cookie": cookie } : {});
    }

    const response = await env.ASSETS.fetch(request);

    if (cookie) {
      const headers = new Headers(response.headers);
      headers.append("Set-Cookie", cookie);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};
