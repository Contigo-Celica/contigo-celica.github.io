// Utilidades compartidas por el sitio público y el panel.
(() => {
  const C = window.APP_CONFIG;
  const ROOT = new URL('../../', document.currentScript.src).href; // raíz del sitio (funciona en dominio propio o subcarpeta)
  const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const src = u => !u ? '' : /^https?:\/\//i.test(u) ? u : ROOT + u.replace(/^\/+/, '');
  const thumb = u => (u && /\/media\/img\/[0-9a-f]{16}\.(webp|jpg|png)$/.test(u)) ? u.replace(/\.(webp|jpg|png)$/, '_t.$1') : (u && u.endsWith('candidato.webp') ? u.replace('.webp', '_t.webp') : u);
  const paras = t => (t || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => `<p>${esc(b).replace(/\n/g, '<br>')}</p>`).join('');
  const yt = u => ((u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1] || '';
  const facts = t => (t || '').split('\n').filter(l => l.includes(':')).map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });
  const wa = v => { v = (v || '').trim(); if (/^https?:\/\//i.test(v)) return v; const d = v.replace(/\D/g, ''); return d.length >= 8 ? 'https://wa.me/' + d : ''; };
  const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';
  // Enlaces de Facebook / Instagram / TikTok: nombre de la red y dirección para incrustar el video o la publicación.
  const social = u => {
    u = safeUrl(u); if (!u) return null;
    let h; try { h = new URL(u).hostname.replace(/^(www|m|web|vm|vt)\./, ''); } catch { return null; }
    if (/^(facebook\.com|fb\.watch|fb\.com)$/.test(h)) return { net: 'facebook', name: 'Facebook', url: u, tall: /\/reel\//.test(u),
      embed: `https://www.facebook.com/plugins/${/\/(videos?|reel|watch)\b|fb\.watch/.test(u) ? 'video' : 'post'}.php?href=${encodeURIComponent(u)}&show_text=false` };
    if (h === 'instagram.com') { const m = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reels?|tv)\/([\w-]+)/); return { net: 'instagram', name: 'Instagram', url: u, tall: true, embed: m ? `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed` : '' }; }
    if (h === 'tiktok.com') { const m = u.match(/\/video\/(\d+)/); return { net: 'tiktok', name: 'TikTok', url: u, tall: true, embed: m ? `https://www.tiktok.com/player/v1/${m[1]}` : '' }; }
    return null;
  };
  window.APP = { sb, ROOT, esc, src, thumb, paras, yt, facts, wa, safeUrl, social, schema: window.APP_SCHEMA, parishNames: Object.fromEntries(window.APP_SCHEMA.parishes) };
})();
