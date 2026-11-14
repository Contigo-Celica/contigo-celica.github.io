(async () => {
  const { sb, ROOT, esc, src, thumb, paras, yt, facts, wa, safeUrl, parishNames, social } = window.APP;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body, page = body.dataset.page, slug = body.dataset.slug || '';
  const root = $('#root');

  let s = {}, items = [], ideas = [];
  try {
    const [st, it, id] = await Promise.all([
      sb.from('settings').select('k,v'),
      sb.from('items').select('id,kind,data,sort,created').eq('status', 'publicado').order('sort').order('id', { ascending: false }),
      sb.rpc('approved_ideas')]);
    if (st.error || it.error) throw st.error || it.error;
    s = Object.fromEntries(st.data.map(r => [r.k, r.v]));
    items = it.data.map(r => ({ ...r.data, id: r.id, kind: r.kind, created: r.created }));
    ideas = id.data || [];
  } catch (e) {
    root.innerHTML = '<p class="loading">No se pudo cargar el contenido. Revisa tu conexión y recarga la página.</p>';
    return;
  }
  const of = (k, p) => items.filter(i => i.kind === k && (p === undefined || i.parish === p));
  const pmap = Object.fromEntries(of('parishes').map(p => [p.slug, p]));
  const parishes = window.APP.schema.parishes.map(([sl]) => pmap[sl]).filter(Boolean);
  const news = p => of('news', p).sort((a, b) => (b.date || b.created).localeCompare(a.date || a.created));
  const cats = (s.categories || '').split('\n').map(c => c.trim()).filter(Boolean);
  const href = p => ROOT + p;
  const pillars = of('pillars');
  const subs = p => [1, 2].filter(n => p['sub' + n + '_title']).map(n => ({ t: p['sub' + n + '_title'], x: p['sub' + n + '_text'], img: p['sub' + n + '_image'] }));
  const plan = () => pillars.length ? `${s.plan_quote ? `<blockquote class="plan-quote rv">“${esc(s.plan_quote)}”</blockquote>` : ''}<div class="plan rv"><div class="plan-grid">${pillars.map((p, i) => `<a class="pillar c-${esc(p.color || 'azul')}" href="${href('eje/' + p.slug + '/')}">
      <h3 class="pillar-h"><span>${i + 1}.</span> ${esc(p.title)}</h3>
      <div class="pillar-b">${subs(p).map(u => `<div class="sub"><h4>${esc(u.t)}</h4>${u.img ? `<img src="${esc(src(u.img))}" alt="" loading="lazy">` : ''}<p>${esc(u.x)}</p></div>`).join('')}</div>
      <span class="pillar-more">Conoce más sobre este eje →</span></a>`).join('')}
      <img class="plan-shield" src="${esc(src('assets/plan/escudo.webp'))}" alt="Plan Contigo" width="150" height="160"></div>
    ${s.plan_image ? `<p class="plan-full"><a href="${esc(src(s.plan_image))}" data-lb data-cap="${esc(s.plan_title)}">🔍 Ver infografía completa</a></p>` : ''}</div>${facts(s.plan_commitments).length ? `<div class="commit">${facts(s.plan_commitments).map(([t, x]) => `<div class="commit-i rv"><h4>${esc(t)}</h4><p>${esc(x)}</p></div>`).join('')}</div>` : ''}` : '';

  // ---------- piezas
  const seal = () => s.seal ? `<img class="seal" src="${esc(src(s.seal))}" alt="Una sola lucha por Celica" width="96" height="110" loading="lazy">` : '';
  const pic = (u, alt, cls = '', big) => u ? `<img class="${cls}" src="${esc(src(big ? u : thumb(u)))}" alt="${esc(alt)}" loading="lazy" decoding="async">` : `<div class="${cls} ph" aria-hidden="true"><span>${esc((alt || 'A')[0])}</span></div>`;
  const head = (eb, t, p, y) => `<div class="head rv"><span class="eyebrow${y ? ' y' : ''}">${esc(eb)}</span><h2 class="ttl">${esc(t)}</h2>${p ? `<p>${esc(p)}</p>` : ''}</div>`;
  const sec = (cls, id, inner) => `<section class="sec ${cls}"${id ? ` id="${id}"` : ''}>${inner}${seal()}</section>`;
  const icon = {
    fb: '<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4.3V10H7v4h3v8h4v-8h3l1-4h-4V8.6c0-.4.3-.6.6-.6z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21.9 8c-.1-1.6-.4-3-1.6-4.2S17.6 2.2 16 2.1C14.4 2 9.6 2 8 2.1 6.4 2.2 5 2.5 3.8 3.7S2.2 6.4 2.1 8C2 9.6 2 14.4 2.1 16c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.4.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.4 0-8zM19.8 18a3 3 0 0 1-1.8 1.8c-1.2.5-4.2.4-5.6.4s-4.4.1-5.6-.4A3 3 0 0 1 5 18c-.5-1.2-.4-4.2-.4-5.6s-.1-4.4.4-5.6A3 3 0 0 1 6.8 5c1.2-.5 4.2-.4 5.6-.4s4.4-.1 5.6.4A3 3 0 0 1 19.8 6.8c.5 1.2.4 4.2.4 5.6s.1 4.4-.4 5.6z"/></svg>',
    tt: '<svg viewBox="0 0 24 24"><path d="M19.6 8.3a6.7 6.7 0 0 1-3.9-1.3v6a5.5 5.5 0 1 1-4.7-5.4v3a2.5 2.5 0 1 0 1.7 2.4V2h3a3.9 3.9 0 0 0 3.9 3.4z"/></svg>'
  };
  const waUrl = wa(s.whatsapp);

  const header = () => `<header class="hdr" id="top">
    <nav class="pbar" aria-label="Parroquias"><div class="wrap pbar-in"><span class="pbar-lbl">Parroquias</span>
      ${parishes.map(p => `<a href="${href('parroquia/' + p.slug + '/')}" class="pbtn${p.slug === slug ? ' on' : ''}">${esc(p.name)}</a>`).join('')}</div></nav>
    <div class="wrap nav">
      <a href="${ROOT}" class="brand" aria-label="Inicio">${s.logo ? `<img src="${esc(src(s.logo))}" alt="${esc(s.candidate_name)}" width="54" height="54">` : ''}
        <span><b>${esc((s.candidate_name || '').replace('Abg. ', ''))}</b><small>${esc(s.party)} · Alcaldía de Celica</small></span></a>
      <button class="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="menu"><i></i><i></i><i></i></button>
      <ul class="menu" id="menu">${[['inicio', 'Inicio'], ['biografia', 'Biografía'], ['experiencia', 'Experiencia'], ['galeria', 'Galería'], ['propuestas', 'Propuestas'], ['noticias', 'Noticias'], ['contacto', 'Contacto']]
      .map(([h, t]) => `<li><a href="${h === 'contacto' ? '#contacto' : ROOT + '#' + h}">${t}</a></li>`).join('')}<li><a href="#participa" class="btn btn-y sm">Participa</a></li></ul>
    </div></header>`;

  const footer = () => `<footer class="ftr" id="contacto"><div class="wrap ftr-grid">
      <div>${s.logo_white ? `<img class="ftr-logo" src="${esc(src(s.logo_white))}" alt="${esc(s.candidate_name)}" loading="lazy" width="150" height="142">` : ''}<p class="ftr-slogan">${esc(s.slogan)}</p></div>
      <div><h2>${esc(s.contact_title || 'Contacto')}</h2><div class="socials">
        ${safeUrl(s.facebook) ? `<a class="soc fb" href="${esc(s.facebook)}" target="_blank" rel="noopener">${icon.fb}Facebook</a>` : ''}
        ${waUrl ? `<a class="soc wa" href="${esc(waUrl)}" target="_blank" rel="noopener">${icon.wa}WhatsApp Contigo Celica</a>` : ''}
        ${safeUrl(s.instagram) ? `<a class="soc ig" href="${esc(s.instagram)}" target="_blank" rel="noopener">${icon.ig}Instagram</a>` : ''}
        ${safeUrl(s.tiktok) ? `<a class="soc tt" href="${esc(s.tiktok)}" target="_blank" rel="noopener">${icon.tt}TikTok</a>` : ''}
        ${!(s.facebook || waUrl || s.instagram || s.tiktok) ? '<p class="muted">Pronto publicaremos nuestras redes sociales.</p>' : ''}</div>
        <ul class="contact">${s.phone ? `<li>📞 <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a></li>` : ''}${s.email ? `<li>✉️ <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>` : ''}${s.address ? `<li>📍 ${esc(s.address)}</li>` : ''}</ul></div>
      <div><h2>Parroquias</h2><ul class="flinks">${parishes.map(p => `<li><a href="${href('parroquia/' + p.slug + '/')}">${esc(p.name)}</a></li>`).join('')}</ul></div>
    </div><div class="wrap ftr-bottom">© ${esc(s.candidate_name)} · ${esc(s.party)} · Celica, Loja, Ecuador</div>${seal()}</footer>
    ${waUrl ? `<a class="wa-float" href="${esc(waUrl)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon.wa}</a>` : ''}
    <div class="lb" hidden><button class="lb-x" aria-label="Cerrar">×</button><div class="lb-m"></div><p></p></div>`;

  const propsGrid = list => `<div class="grid3 props">${list.map(x => `<article class="card prop rv" data-parish="${esc(x.parish || '')}">
      ${x.image ? pic(x.image, x.title, 'card-img') : ''}<div class="card-b"><div class="tags">${x.category ? `<span class="tag">${esc(x.category)}</span>` : ''}<span class="tag t2">${esc(parishNames[x.parish] || 'Todo el cantón')}</span></div>
      <h3>${esc(x.title)}</h3>${x.summary ? `<p>${esc(x.summary)}</p>` : ''}${x.body ? `<details><summary>Ver detalle</summary><div class="prose sm">${paras(x.body)}</div></details>` : ''}</div></article>`).join('')
    || '<p class="muted empty">Muy pronto publicaremos las propuestas.</p>'}</div>`;

  // Portada de una publicación de red social: imagen subida o tarjeta con el color de la red.
  const socCover = (sc, image, alt, cls) => image ? pic(image, alt, cls) : `<div class="${cls} soc-ph soc-${sc.net}" aria-hidden="true"><b>${sc.name}</b></div>`;
  const socLink = (sc, cls, inner) => `<a class="${cls} soc" href="${esc(sc.url)}" target="_blank" rel="noopener" draggable="false">${inner}</a>`;

  const newsGrid = list => `<div class="grid3">${list.map(n => {
    const vid = yt(n.video_url), link = safeUrl(n.link), sc = !vid ? social(n.video_url) || social(n.link) : null;
    let media = '';
    if (n.video) media = `<video class="card-img" src="${esc(src(n.video))}" controls preload="none" ${n.image ? `poster="${esc(src(thumb(n.image)))}"` : ''} playsinline></video>`;
    else if (vid) media = `<button class="yt card-img" data-yt="${vid}" aria-label="Reproducir video"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="${esc(n.title)}" loading="lazy"><span class="play"></span></button>`;
    else if (sc) media = socLink(sc, 'card-img-wrap', socCover(sc, n.image, n.title, 'card-img'), n.title);
    else if (n.image) media = link ? `<a href="${esc(link)}" target="_blank" rel="noopener" class="imglink">${pic(n.image, n.title, 'card-img')}<span class="go">Ver más ↗</span></a>` : pic(n.image, n.title, 'card-img');
    const d = n.date ? `${n.date.slice(8, 10)}/${n.date.slice(5, 7)}/${n.date.slice(0, 4)}` : '';
    return `<article class="card news rv">${media}<div class="card-b"><div class="tags">${d ? `<span class="tag">${d}</span>` : ''}${n.parish ? `<span class="tag t2">${esc(parishNames[n.parish])}</span>` : ''}</div>
      <h3>${esc(n.title)}</h3>${n.summary ? `<p>${esc(n.summary)}</p>` : ''}
      ${sc ? `<a class="more" href="${esc(sc.url)}" target="_blank" rel="noopener">Ver en ${sc.name} ↗</a>` : n.video_url && !vid && safeUrl(n.video_url) ? `<a class="more" href="${esc(n.video_url)}" target="_blank" rel="noopener">▶ Ver video</a>` : link ? `<a class="more" href="${esc(link)}" target="_blank" rel="noopener">Leer más ↗</a>` : ''}</div></article>`;
  }).join('') || '<p class="muted empty">Pronto compartiremos nuestras actividades.</p>'}</div>`;

  // Elemento de galería: foto, video subido, YouTube (se abren en el visor) o Facebook (abre en pestaña nueva).
  const galItem = (i, cls, imgCls = '', extra = '') => {
    const id = yt(i.video_url), vurl = i.video ? src(i.video) : '', sc = !id && !vurl ? social(i.video_url) : null, fb = !id && !vurl && !sc ? safeUrl(i.video_url) : '';
    if (sc) return socLink(sc, cls, socCover(sc, i.image, i.title || sc.name, imgCls), (i.title || '') + (i.caption ? ' — ' + i.caption : '')).replace('</a>', extra + '</a>');
    const vid = !!(id || vurl || fb), alt = i.title || 'Galería';
    if (!i.image && !vid) return '';
    const cover = i.image ? pic(i.image, alt, imgCls) : id ? `<img class="${imgCls}" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${esc(alt)}" loading="lazy">`
      : vurl ? `<video class="${imgCls}" src="${esc(vurl)}#t=0.5" muted playsinline preload="metadata"></video>` : `<div class="${imgCls} ph" aria-hidden="true"><span>▶</span></div>`;
    const cap = esc((i.title || '') + (i.caption ? ' — ' + i.caption : ''));
    const attrs = fb ? `href="${esc(fb)}" target="_blank" rel="noopener"`
      : `href="${esc(id ? 'https://www.youtube.com/watch?v=' + id : vurl || src(i.image))}" data-lb${id ? ` data-yt="${id}"` : vurl ? ' data-video' : ''} data-cap="${cap}"`;
    return `<a class="${cls}${vid ? ' is-vid' : ''}" ${attrs} draggable="false">${cover}${vid ? '<span class="play" aria-hidden="true"></span>' : ''}${extra}</a>`;
  };
  const galStrip = list => {
    const items = list.map(i => galItem(i, 'shot', 'shot-img', i.title || i.parish ? `<span class="shot-t">${i.title ? `<b>${esc(i.title)}</b>` : ''}${i.parish ? `<small>${esc(parishNames[i.parish])}</small>` : ''}</span>` : '')).join('');
    if (!items) return '<div class="wrap"><p class="muted empty">Pronto compartiremos fotografías y videos de la campaña.</p></div>';
    return list.length < 4 ? `<div class="wrap shots">${items}</div>`
      : `<div class="carousel" aria-label="Galería"><button class="car-btn prev" type="button" aria-label="Anterior">‹</button><div class="car-view"><div class="car-track">${items}</div></div><button class="car-btn next" type="button" aria-label="Siguiente">›</button></div>`;
  };

  const form = () => sec('purple', 'participa', `<div class="wrap part"><div class="rv"><span class="eyebrow y">Tu voz cuenta</span><h2 class="ttl">${esc(s.participa_title)}</h2><p class="lead">${esc(s.participa_intro)}</p>
      <ul class="checks"><li>Todos los datos personales son opcionales.</li><li>Tu información es confidencial y solo la ve el equipo de campaña.</li><li>Las ideas se publican únicamente tras ser revisadas y sin datos personales.</li></ul></div>
    <form class="pform rv d2" novalidate>
      <div class="hp" aria-hidden="true"><label>Sitio web <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <label class="full">Nombre completo <em>(opcional)</em><input name="name" maxlength="120" autocomplete="name"></label>
      <label>Cédula <em>(opcional)</em><input name="cedula" inputmode="numeric" maxlength="10"></label>
      <label>Celular <em>(opcional)</em><input name="phone" type="tel" inputmode="tel" maxlength="15" autocomplete="tel"></label>
      <label class="full">Correo electrónico <em>(opcional)</em><input name="email" type="email" maxlength="200" autocomplete="email"></label>
      <label>Parroquia<select name="parish"><option value="">Todo el cantón</option>${parishes.map(p => `<option value="${p.slug}"${p.slug === slug ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
      <label>Tema<select name="category"><option value="">Selecciona…</option>${cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></label>
      <label class="full">Tu idea, necesidad o propuesta *<textarea name="message" rows="5" minlength="10" maxlength="3000" required></textarea></label>
      <button class="btn btn-y full" type="submit">Enviar mi aporte</button><p class="fmsg full" role="status" aria-live="polite"></p>
    </form></div>`);

  // ---------- páginas
  function home() {
    const exp = of('experience'), form_ = exp.filter(e => e.type === 'formacion'), tray = exp.filter(e => e.type !== 'formacion');
    const tl = (grp, label) => `<div class="tl rv"><h3>${label}</h3>${grp.map(e => `<article class="tl-i"><span class="per">${esc(e.period)}</span><h4>${esc(e.title)}</h4>${e.institution ? `<p class="inst">${esc(e.institution)}</p>` : ''}${e.description ? `<p>${esc(e.description)}</p>` : ''}</article>`).join('') || '<p class="muted">Información en preparación.</p>'}</div>`;
    return `<section class="hero" id="inicio"><div class="hero-bg" aria-hidden="true"><i></i><i></i><i></i></div><div class="wrap hero-in">
        <div class="hero-txt intro"><span class="kicker">${esc(s.hero_kicker)}</span><h1>${esc(s.candidate_name)}</h1><p class="role">${esc(s.candidate_role)}</p><p class="lead">${esc(s.hero_text)}</p>
          <div class="cta"><a href="#propuestas" class="btn btn-y">${esc(s.hero_cta || 'Propuestas')}</a><a href="#participa" class="btn btn-o">Envía tu idea</a></div></div>
        <div class="hero-pic intro d2">${s.hero_photo ? `<img src="${esc(src(s.hero_photo))}" alt="${esc(s.candidate_name)}" fetchpriority="high" width="890" height="1205">` : '<div class="ph big"><span>J</span></div>'}</div>
      </div>${seal()}</section>`
      + sec('', 'biografia', `<div class="wrap bio"><div class="bio-pic rv">${pic(s.bio_photo, s.candidate_name, 'bio-img', true)}</div><div class="rv d2"><span class="eyebrow">Conóceme</span><h2 class="ttl">${esc(s.bio_title)}</h2><div class="prose">${paras(s.bio_text)}</div></div></div>`)
      + sec('alt', 'experiencia', `<div class="wrap">${head('Trayectoria', s.exp_title, s.exp_intro)}<div class="exp">${tl(form_, 'Formación académica')}${tl(tray, 'Trayectoria institucional')}</div></div>`)
      + sec('purple', 'galeria', `<div class="wrap">${head('Galería', s.gallery_title || 'Nuestra campaña en imágenes', s.gallery_intro, true)}</div>${galStrip(of('gallery'))}`)
      + sec('', 'propuestas', `<div class="wrap">${pillars.length ? head('Plan Contigo', s.plan_title, s.plan_intro) + plan() + `<h3 class="sub-ttl rv">${esc(s.proposals_title)}</h3>` : head('Plan de trabajo', s.proposals_title, s.proposals_intro)}<div class="chips rv"><button class="chip on" data-f="">Del cantón</button>${parishes.map(p => `<button class="chip" data-f="${p.slug}">${esc(p.name)}</button>`).join('')}<button class="chip" data-f="*">Todas</button></div>${propsGrid(of('proposals'))}</div>`)
      + sec('purple', 'parroquias', `<div class="wrap">${head('Territorio', 'Nuestras parroquias', 'Propuestas, comunidades y fotografías de cada rincón del cantón.', true)}<div class="pgrid">${parishes.map(p => `<a class="pcard rv" href="${href('parroquia/' + p.slug + '/')}">${pic(p.cover, p.name, 'pcard-img')}<span class="pcard-t"><b>${esc(p.name)}</b><small>${esc(p.tagline || 'Ver propuestas y comunidades')} →</small></span></a>`).join('')}</div></div>`)
      + sec('', 'noticias', `<div class="wrap">${head('Agenda', s.news_title, s.news_intro)}${newsGrid(news().slice(0, 12))}</div>`)
      + (ideas.length ? sec('', 'voces', `<div class="wrap">${head('Voces ciudadanas', 'Lo que propone la gente')}<div class="voices">${ideas.map(i => `<blockquote class="voice rv"><p>“${esc(i.message.length > 260 ? i.message.slice(0, 257) + '…' : i.message)}”</p><footer>${esc(i.category || 'Aporte ciudadano')}${i.parish ? ' · ' + esc(parishNames[i.parish]) : ''}</footer></blockquote>`).join('')}</div></div>`) : '')
      + form();
  }

  function parish() {
    const p = pmap[slug];
    if (!p) return '<section class="sec"><div class="wrap head"><h1 class="ttl">Parroquia no encontrada</h1></div></section>';
    document.title = `Parroquia ${p.name} | ${s.site_name}`;
    const fx = facts(p.facts), comm = of('communities', slug), gal = of('gallery', slug), team = of('team', slug), nw = news(slug).slice(0, 6);
    return `<section class="phero">${p.cover ? `<img class="phero-img" src="${esc(src(p.cover))}" alt="Parroquia ${esc(p.name)}" fetchpriority="high">` : ''}
        <div class="wrap phero-in intro"><a href="${ROOT}#parroquias" class="back">← Todas las parroquias</a><span class="kicker">Parroquia</span><h1>${esc(p.name)}</h1>${p.tagline ? `<p class="lead">${esc(p.tagline)}</p>` : ''}</div>${seal()}</section>`
      + sec('', '', `<div class="wrap pinfo"><div class="rv"><span class="eyebrow">Conoce ${esc(p.name)}</span><div class="prose">${paras(p.description)}</div></div>${fx.length ? `<dl class="facts rv d2">${fx.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}</div>`)
      + sec('alt', 'propuestas', `<div class="wrap">${head('Plan de trabajo', 'Propuestas para ' + p.name)}${propsGrid(of('proposals', slug))}</div>`)
      + (comm.length ? sec('', '', `<div class="wrap">${head('Territorio', 'Comunidades')}<div class="grid3">${comm.map(c => `<article class="card rv">${pic(c.image, c.name, 'card-img')}<div class="card-b"><h3>${esc(c.name)}</h3>${c.description ? `<div class="prose sm">${paras(c.description)}</div>` : ''}</div></article>`).join('')}</div></div>`) : '')
      + (gal.length ? sec('alt', '', `<div class="wrap">${head('Galería', p.name + ' en imágenes y videos')}<div class="gal">${gal.map(i => galItem(i, 'gal-i rv')).join('')}</div></div>`) : '')
      + (team.length ? sec('', 'equipo', `<div class="wrap">${head('Junta parroquial', 'Nuestro equipo en ' + p.name)}${team.map(t => `<a class="teamfull rv" href="${esc(src(t.photo))}" data-lb data-cap="${esc([t.name, t.role].filter(Boolean).join(' · '))}"><img src="${esc(src(t.photo))}" alt="${esc('Equipo de ' + p.name)}" loading="lazy" decoding="async"><span>🔍 Ampliar</span></a>`).join('')}</div>`) : '')
      + (nw.length ? sec('alt', 'noticias', `<div class="wrap">${head('Agenda', 'Actividades en ' + p.name)}${newsGrid(nw)}</div>`) : '')
      + form();
  }


  function pillar() {
    const i = pillars.findIndex(p => p.slug === slug), p = pillars[i];
    if (!p) return '<section class="sec"><div class="wrap head"><h1 class="ttl">Eje no encontrado</h1></div></section>';
    document.title = `${p.title} · Plan Contigo | ${s.site_name}`;
    const vid = yt(p.video_url), props = of('proposals').filter(x => x.pillar === p.slug), c = esc(p.color || 'azul');
    return `<section class="phero eje c-${c}"><div class="wrap phero-in intro"><a href="${ROOT}#propuestas" class="back">← Los 4 pilares del Plan Contigo</a><span class="kicker">Eje ${i + 1} · Plan Contigo</span><h1>${esc(p.title)}</h1>${p.tagline ? `<p class="lead">${esc(p.tagline)}</p>` : ''}</div>${seal()}</section>`
      + sec('', '', `<div class="wrap pinfo"><div class="rv"><span class="eyebrow">Más información</span><div class="prose">${paras(p.detail)}</div></div>${vid ? `<div class="rv d2"><button class="yt card-img" data-yt="${vid}" aria-label="Reproducir video"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" loading="lazy"><span class="play"></span></button></div>` : ''}</div>`)
      + (facts(p.actions).length ? sec('alt', '', `<div class="wrap">${head('Líneas de acción', '¿Qué haremos?')}<ol class="acts c-${c}">${facts(p.actions).map(([t, x]) => `<li class="act rv"><h3>${esc(t)}</h3><p>${esc(x)}</p></li>`).join('')}</ol></div>`) : '')
      + ([p.infographic, p.infographic2].some(Boolean) ? sec('', '', `<div class="wrap">${head('Infografía', p.title)}<div class="infos">${[p.infographic, p.infographic2].filter(Boolean).map(u => `<a class="info rv" href="${esc(src(u))}" data-lb data-cap="${esc(p.title)}"><img src="${esc(src(u))}" alt="Infografía: ${esc(p.title)}" loading="lazy"><span>🔍 Ampliar</span></a>`).join('')}</div></div>`) : '')
      + sec(facts(p.actions).length ? '' : 'alt', '', `<div class="wrap"><div class="subs c-${c}">${subs(p).map(u => `<article class="card rv">${u.img ? `<img class="card-img contain" src="${esc(src(u.img))}" alt="" loading="lazy">` : ''}<div class="card-b"><h3>${esc(u.t)}</h3><p>${esc(u.x)}</p></div></article>`).join('')}</div></div>`)
      + sec('', 'propuestas', `<div class="wrap">${head('Propuestas', 'Proyectos de este eje')}${propsGrid(props)}</div>`)
      + sec('alt', '', `<div class="wrap">${head('Plan Contigo', 'Conoce los otros ejes')}<div class="plan-mini">${pillars.filter(o => o !== p).map(o => `<a class="pillar-mini c-${esc(o.color || 'azul')}" href="${href('eje/' + o.slug + '/')}"><b>${pillars.indexOf(o) + 1}.</b> ${esc(o.title)} →</a>`).join('')}</div></div>`)
      + form();
  }

  root.outerHTML = header() + `<main>${page === 'parish' ? parish() : page === 'pillar' ? pillar() : home()}</main>` + footer();
  if (location.hash) $(location.hash)?.scrollIntoView();

  // ---------- interacciones
  const burger = $('.burger'), menu = $('#menu'), hdr = $('.hdr');
  const toggle = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => toggle(!menu.classList.contains('open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('scroll', () => hdr.classList.toggle('scr', scrollY > 10), { passive: true });

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // Propuestas de la portada en páginas deslizables: 6 por página en computadora, 2 en celular.
  let propFilter = null;
  const pool = $('#propuestas .chips') && $('#propuestas .props'); // solo en la portada (la que tiene filtros)
  if (pool) {
    const cards = [...pool.querySelectorAll('.prop')], mq = matchMedia('(max-width:700px)');
    const box = document.createElement('div'); box.className = 'pager';
    box.innerHTML = '<div class="pg-view" tabindex="0" aria-label="Propuestas"></div><div class="pg-nav"><button type="button" class="pg-btn prev" aria-label="Propuestas anteriores">‹</button><span class="pg-dots"></span><button type="button" class="pg-btn next" aria-label="Más propuestas">›</button></div>';
    pool.replaceWith(box);
    const view = $('.pg-view', box), dots = $('.pg-dots', box), nav = $('.pg-nav', box);
    let f = '';
    const page = () => Math.round(view.scrollLeft / (view.clientWidth || 1));
    const sync = () => { const i = page(), n = view.children.length; [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i)); $('.prev', box).disabled = i <= 0; $('.next', box).disabled = i >= n - 1; };
    const go = i => { view.scrollTo({ left: Math.max(0, i) * view.clientWidth, behavior: 'smooth' }); };
    const build = () => {
      const per = mq.matches ? 2 : 6, list = cards.filter(c => f === '*' || c.dataset.parish === f);
      view.replaceChildren();
      for (let i = 0; i < list.length; i += per) { const pg = document.createElement('div'); pg.className = 'pg-page grid3 props'; pg.append(...list.slice(i, i + per)); view.append(pg); }
      if (!list.length) view.innerHTML = '<p class="muted empty">Aún no hay propuestas en esta sección.</p>';
      const n = list.length ? view.children.length : 0;
      dots.innerHTML = Array.from({ length: n }, (_, k) => `<button type="button" aria-label="Página ${k + 1}"></button>`).join('');
      nav.hidden = n < 2; view.scrollLeft = 0; sync();
    };
    view.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    dots.addEventListener('click', e => { const k = [...dots.children].indexOf(e.target); if (k >= 0) go(k); });
    $('.prev', box).onclick = () => go(page() - 1);
    $('.next', box).onclick = () => go(page() + 1);
    view.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(page() + 1); if (e.key === 'ArrowLeft') go(page() - 1); });
    mq.addEventListener('change', build);
    propFilter = v => { f = v; build(); };
  }

  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('on', x === c));
    if (propFilter) return propFilter(c.dataset.f);
    $$('.prop').forEach(p => p.classList.toggle('hide', c.dataset.f !== '*' && p.dataset.parish !== c.dataset.f));
  }));
  $('.chips .chip.on')?.click();

  $$('.mq-track').forEach(t => {
    const items = [...t.children];
    while (t.children.length < 8) items.forEach(i => t.appendChild(i.cloneNode(true)));
    [...t.children].forEach(i => { const c = i.cloneNode(true); c.setAttribute('aria-hidden', 'true'); t.appendChild(c); });
    t.style.setProperty('--dur', (t.children.length * 2.6) + 's');
  });

  $$('.yt').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1`;
    f.className = 'card-img'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true; f.title = 'Video';
    b.replaceWith(f);
  }));

  // Visor: fotos, videos subidos y YouTube. Al cerrar se detiene la reproducción.
  const lb = $('.lb'), lbm = $('.lb-m', lb);
  const lbClose = () => { lb.hidden = true; lbm.innerHTML = ''; };
  document.addEventListener('click', e => {
    if (e.target.closest('.carousel.dragged a')) { e.preventDefault(); return; }
    const a = e.target.closest('[data-lb]'); if (!a) return;
    e.preventDefault(); if (a.closest('.carousel.dragged')) return;
    let m;
    if (a.dataset.yt) { m = document.createElement('iframe'); m.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1`; m.allow = 'autoplay; encrypted-media; picture-in-picture'; m.allowFullscreen = true; m.title = 'Video'; }
    else if ('video' in a.dataset) { m = document.createElement('video'); m.src = a.href; m.controls = m.autoplay = m.playsInline = true; }
    else { m = document.createElement('img'); m.src = a.href; m.alt = a.dataset.cap || ''; }
    lbm.replaceChildren(m); const cp = $('p', lb); cp.textContent = a.dataset.cap || '';
    lb.hidden = false;
  });
  lb.addEventListener('click', e => { if (!e.target.closest('.lb-m > *')) lbClose(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) lbClose(); });

  // Carrusel de la galería: avanza solo, con flechas, arrastre con el mouse y deslizamiento táctil.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('.carousel').forEach(car => {
    const view = $('.car-view', car), track = $('.car-track', car), n = track.children.length;
    for (let k = 0; k < 2; k++) [...track.children].slice(0, n).forEach(i => { const c = i.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; track.appendChild(c); });
    const H = () => track.children[n].offsetLeft - track.children[0].offsetLeft; // ancho de una vuelta
    const step = () => track.children[0].offsetWidth + 22;
    const SPEED = 40; // px por segundo
    let pos = 0, last = 0, hold = 0, hover = false, drag = null, anim = null;
    const put = v => { const h = H(); pos = ((v % h) + h) % h; view.scrollLeft = pos + h; };
    const pause = ms => { hold = Date.now() + ms; };
    put(0);
    const tick = t => {
      const dt = Math.min(64, t - (last || t)); last = t;
      if (anim) { const k = Math.min(1, (t - anim.t0) / 450), e = 1 - Math.pow(1 - k, 3); put(anim.from + (anim.to - anim.from) * e); if (k === 1) anim = null; }
      else if (drag) { /* el arrastre mueve el carrusel */ }
      else if (hover || Date.now() < hold || still) pos = view.scrollLeft - H();
      else put(pos + SPEED * dt / 1000);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const go = d => { anim = { from: pos, to: pos + d * step(), t0: performance.now() }; pause(5000); };
    $('.prev', car).onclick = () => go(-1);
    $('.next', car).onclick = () => go(1);
    view.addEventListener('mouseenter', () => { hover = true; });
    view.addEventListener('mouseleave', () => { hover = false; });
    view.addEventListener('touchstart', () => pause(4000), { passive: true });
    view.addEventListener('touchmove', () => pause(4000), { passive: true });
    view.addEventListener('wheel', () => pause(3000), { passive: true });
    view.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; drag = { x: e.clientX, p: pos, moved: false }; });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 5) { drag.moved = true; car.classList.add('grab'); } if (drag.moved) put(drag.p - dx); });
    addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.moved) { car.classList.add('dragged'); setTimeout(() => car.classList.remove('dragged'), 0); }
      car.classList.remove('grab'); drag = null; pause(2500);
    });
    view.addEventListener('dragstart', e => e.preventDefault());
  });

  // formulario de participación (validación también en la base de datos)
  const ERR = { CEDULA: 'El número de cédula no es válido. Puedes dejarlo en blanco.', PHONE: 'El número de celular no es válido. Puedes dejarlo en blanco.', EMAIL: 'El correo electrónico no es válido. Puedes dejarlo en blanco.', LINKS: 'El mensaje contiene demasiados enlaces.', RATE: 'Has enviado varios aportes en poco tiempo. Inténtalo más tarde.' };
  const opened = Date.now();
  $$('.pform').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('.fmsg', f), btn = $('button[type=submit]', f), show = (ok, t) => { msg.className = 'fmsg full ' + (ok ? 'ok' : 'err'); msg.textContent = t; };
    const v = Object.fromEntries(new FormData(f));
    if (v.website) return show(true, s.participa_thanks);
    if (v.message.trim().length < 10) { f.message.focus(); return show(false, 'Cuéntanos tu idea con un poco más de detalle (mínimo 10 caracteres).'); }
    if (Date.now() - opened < 3000) return show(false, 'Envío demasiado rápido. Inténtalo de nuevo.');
    btn.disabled = true; btn.textContent = 'Enviando…';
    const { error } = await sb.from('ideas').insert({ name: v.name, cedula: v.cedula, phone: v.phone, email: v.email, parish: v.parish || null, category: v.category, message: v.message.trim() });
    btn.disabled = false; btn.textContent = 'Enviar mi aporte';
    if (error) return show(false, ERR[Object.keys(ERR).find(k => (error.message || '').includes(k))] || 'No pudimos enviar tu aporte. Inténtalo de nuevo.');
    f.reset(); show(true, s.participa_thanks || '¡Gracias!');
  }));
})();
