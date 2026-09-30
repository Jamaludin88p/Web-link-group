const crypto = require("crypto");
const { promisify } = require("util");
const scrypt = promisify(crypto.scrypt);

const COOKIE = "linkgc_session";
const MAX_AGE = 7 * 24 * 3600; // 7 hari

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur (minimal 16 karakter)");
  return s;
}

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function verifyPassword(pw, stored) {
  const [alg, saltHex, hashHex] = String(stored || "").split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const got = await scrypt(pw, Buffer.from(saltHex, "hex"), 64);
  const want = Buffer.from(hashHex, "hex");
  return want.length === got.length && crypto.timingSafeEqual(got, want);
}

function hmac(body) {
  return crypto.createHmac("sha256", secret()).update(body).digest();
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return body + "." + hmac(body).toString("base64url");
}

function verify(token) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = hmac(body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}

function setSession(res, username) {
  const token = sign({ u: username, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

function getSession(req) {
  return verify(parseCookies(req)[COOKIE]);
}

// Wajib login. Permintaan yang mengubah data juga harus membawa header X-Requested-With.
function requireAuth(req, res) {
  const s = getSession(req);
  if (!s) { res.status(401).json({ error: "Belum login" }); return null; }
  if (req.method !== "GET" && req.headers["x-requested-with"] !== "admin") {
    res.status(403).json({ error: "Permintaan ditolak" });
    return null;
  }
  return s;
}

function readBody(req) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  return b && typeof b === "object" ? b : {};
}

function clientIp(req) {
  const xf = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || (req.socket && req.socket.remoteAddress) || "unknown";
}

module.exports = {
  hashPassword, verifyPassword, sign, verify,
  setSession, clearSession, getSession, requireAuth, readBody, clientIp
};
