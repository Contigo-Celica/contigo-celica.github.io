(async () => {
  const { sb, ROOT, esc, src, thumb, paras, yt, facts, wa, safeUrl, parishNames } = window.APP;
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
      <ul class="menu" id="menu">${[['inicio', 'Inicio'], ['biografia', 'Biografía'], ['experiencia', 'Experiencia'], ['propuestas', 'Propuestas'], ['noticias', 'Noticias'], ['equipo', 'Equipo'], ['contacto', 'Contacto']]
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
    <div class="lb" hidden><button class="lb-x" aria-label="Cerrar">×</button><img alt=""><p></p></div>`;

  const propsGrid = list => `<div class="grid3 props">${list.map(x => `<article class="card prop rv" data-parish="${esc(x.parish || '')}">
      ${x.image ? pic(x.image, x.title, 'card-img') : ''}<div class="card-b"><div class="tags">${x.category ? `<span class="tag">${esc(x.category)}</span>` : ''}<span class="tag t2">${esc(parishNames[x.parish] || 'Todo el cantón')}</span></div>
      <h3>${esc(x.title)}</h3>${x.summary ? `<p>${esc(x.summary)}</p>` : ''}${x.body ? `<details><summary>Ver detalle</summary><div class="prose sm">${paras(x.body)}</div></details>` : ''}</div></article>`).join('')
    || '<p class="muted empty">Muy pronto publicaremos las propuestas.</p>'}</div>`;

  const newsGrid = list => `<div class="grid3">${list.map(n => {
    const vid = yt(n.video_url), link = safeUrl(n.link);
    let media = '';
    if (n.video) media = `<video class="card-img" src="${esc(src(n.video))}" controls preload="none" ${n.image ? `poster="${esc(src(thumb(n.image)))}"` : ''} playsinline></video>`;
    else if (vid) media = `<button class="yt card-img" data-yt="${vid}" aria-label="Reproducir video"><img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="${esc(n.title)}" loading="lazy"><span class="play"></span></button>`;
    else if (n.image) media = link ? `<a href="${esc(link)}" target="_blank" rel="noopener" class="imglink">${pic(n.image, n.title, 'card-img')}<span class="go">Ver más ↗</span></a>` : pic(n.image, n.title, 'card-img');
    const d = n.date ? `${n.date.slice(8, 10)}/${n.date.slice(5, 7)}/${n.date.slice(0, 4)}` : '';
    return `<article class="card news rv">${media}<div class="card-b"><div class="tags">${d ? `<span class="tag">${d}</span>` : ''}${n.parish ? `<span class="tag t2">${esc(parishNames[n.parish])}</span>` : ''}</div>
      <h3>${esc(n.title)}</h3>${n.summary ? `<p>${esc(n.summary)}</p>` : ''}
      ${n.video_url && !vid && safeUrl(n.video_url) ? `<a class="more" href="${esc(n.video_url)}" target="_blank" rel="noopener">▶ Ver video</a>` : link ? `<a class="more" href="${esc(link)}" target="_blank" rel="noopener">Leer más ↗</a>` : ''}</div></article>`;
  }).join('') || '<p class="muted empty">Pronto compartiremos nuestras actividades.</p>'}</div>`;

  const teamStrip = list => list.length ? `<div class="marquee" aria-label="Equipo de trabajo"><div class="mq-track">${list.map(t => `<figure class="member">${pic(t.photo, t.name, 'member-img')}<figcaption><b>${esc(t.name)}</b>${t.role ? `<span>${esc(t.role)}</span>` : ''}${t.parish ? `<small>${esc(parishNames[t.parish])}</small>` : ''}</figcaption></figure>`).join('')}</div></div>`
    : '<div class="wrap"><p class="muted empty">Pronto presentaremos a nuestro equipo.</p></div>';

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
        <div class="hero-pic intro d2">${s.hero_photo ? `<img src="${esc(src(s.hero_photo))}" alt="${esc(s.candidate_name)}" fetchpriority="high" width="890" height="1205">` : '<div class="ph big"><span>J</span></div>'}<span class="hero-badge">${esc(s.party)}</span></div>
      </div>${seal()}</section>`
      + sec('', 'biografia', `<div class="wrap bio"><div class="bio-pic rv">${pic(s.bio_photo, s.candidate_name, 'bio-img', true)}</div><div class="rv d2"><span class="eyebrow">Conóceme</span><h2 class="ttl">${esc(s.bio_title)}</h2><div class="prose">${paras(s.bio_text)}</div></div></div>`)
      + sec('alt', 'experiencia', `<div class="wrap">${head('Trayectoria', s.exp_title, s.exp_intro)}<div class="exp">${tl(form_, 'Formación académica')}${tl(tray, 'Trayectoria institucional')}</div></div>`)
      + sec('', 'propuestas', `<div class="wrap">${head('Plan de trabajo', s.proposals_title, s.proposals_intro)}<div class="chips rv"><button class="chip on" data-f="*">Todas</button><button class="chip" data-f="">Cantonales</button>${parishes.map(p => `<button class="chip" data-f="${p.slug}">${esc(p.name)}</button>`).join('')}</div>${propsGrid(of('proposals'))}</div>`)
      + sec('purple', 'parroquias', `<div class="wrap">${head('Territorio', 'Nuestras parroquias', 'Propuestas, comunidades y fotografías de cada rincón del cantón.', true)}<div class="pgrid">${parishes.map(p => `<a class="pcard rv" href="${href('parroquia/' + p.slug + '/')}">${pic(p.cover, p.name, 'pcard-img')}<span class="pcard-t"><b>${esc(p.name)}</b><small>${esc(p.tagline || 'Ver propuestas y comunidades')} →</small></span></a>`).join('')}</div></div>`)
      + sec('', 'noticias', `<div class="wrap">${head('Agenda', s.news_title, s.news_intro)}${newsGrid(news().slice(0, 12))}</div>`)
      + sec('alt', 'equipo', `<div class="wrap">${head('Juntas parroquiales', s.team_title, s.team_intro)}</div>${teamStrip(of('team'))}`)
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
      + (gal.length ? sec('alt', '', `<div class="wrap">${head('Galería', p.name + ' en imágenes')}<div class="gal">${gal.map(i => `<a class="gal-i rv" href="${esc(src(i.image))}" data-lb data-cap="${esc((i.title || '') + (i.caption ? ' — ' + i.caption : ''))}">${pic(i.image, i.title || p.name)}</a>`).join('')}</div></div>`) : '')
      + (team.length ? sec('', 'equipo', `<div class="wrap">${head('Junta parroquial', 'Nuestro equipo en ' + p.name)}</div>${teamStrip(team)}`) : '')
      + (nw.length ? sec('alt', 'noticias', `<div class="wrap">${head('Agenda', 'Actividades en ' + p.name)}${newsGrid(nw)}</div>`) : '')
      + form();
  }

  root.outerHTML = header() + `<main>${page === 'parish' ? parish() : home()}</main>` + footer();
  if (location.hash) $(location.hash)?.scrollIntoView();

  // ---------- interacciones
  const burger = $('.burger'), menu = $('#menu'), hdr = $('.hdr');
  const toggle = open => { menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => toggle(!menu.classList.contains('open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('scroll', () => hdr.classList.toggle('scr', scrollY > 10), { passive: true });

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('on', x === c));
    $$('.prop').forEach(p => p.classList.toggle('hide', c.dataset.f !== '*' && p.dataset.parish !== c.dataset.f));
  }));

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

  const lb = $('.lb');
  $$('[data-lb]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); $('img', lb).src = a.href; $('p', lb).textContent = a.dataset.cap || ''; lb.hidden = false; }));
  lb.addEventListener('click', e => { if (e.target !== $('img', lb)) lb.hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });

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
