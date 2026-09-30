// Deteksi link grup WhatsApp. Hasilnya dinormalisasi ke bentuk https://chat.whatsapp.com/KODE
const WA_RE = /^\s*(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9]{20,26})(?:[/?#]\S*)?\s*$/i;

function parseWaLink(input) {
  const m = String(input || "").match(WA_RE);
  return m ? "https://chat.whatsapp.com/" + m[1] : null;
}

module.exports = { parseWaLink };
