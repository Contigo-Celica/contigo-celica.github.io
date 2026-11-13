(() => {
  const { sb, esc, src, schema } = window.APP;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const view = $('#view');
  const STATUSES = ['pendiente', 'publicado', 'rechazado'], IDEA_ST = ['nueva', 'aprobada', 'rechazada'];
  let me = null, settingsCache = {};
  const cats = () => (settingsCache.categories || '').split('\n').map(c => c.trim()).filter(Boolean);
  const isAdmin = () => me?.role === 'admin';
  const pname = sl => (schema.parishes.find(p => p[0] === sl) || [, 'Todo el cantón'])[1];

  const toast = (m, err) => { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (err ? ' e' : ''); clearTimeout(t._h); t._h = setTimeout(() => t.className = 'toast', 3500); };
  const ok = r => { if (r.error) throw new Error(r.error.message); return r.data; };
  const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

  // ---------------- sesión
  function showLogin(msg) { $('#app').hidden = true; $('#login').hidden = false; $('.login-box .err').textContent = msg || ''; }
  $('.login-box').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target; $('.err', f).textContent = '';
    const { error } = await sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
    if (error) return $('.err', f).textContent = 'Correo o contraseña incorrectos.';
    f.reset(); boot();
  });
  $('#logout').onclick = async () => { await sb.auth.signOut(); me = null; showLogin(); };
  $('.mnav').onclick = () => $('.side').classList.toggle('open');

  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return showLogin();
    const { data } = await sb.from('staff').select('role,email').eq('user_id', session.user.id).maybeSingle();
    if (!data) { await sb.auth.signOut(); return showLogin('Tu cuenta no está autorizada para administrar el sitio.'); }
    me = { ...data, id: session.user.id };
    settingsCache = Object.fromEntries(ok(await sb.from('settings').select('k,v')).map(r => [r.k, r.v]));
    $('#login').hidden = true; $('#app').hidden = false;
    $('#who').textContent = `${me.email} · ${me.role}`;
    route();
  }

  async function stats() {
    const [it, id] = await Promise.all([sb.from('items').select('kind,status'), sb.from('ideas').select('status,parish')]);
    const items = {}, ideas = {}, byP = {}; let pending = 0;
    (it.data || []).forEach(r => { items[r.kind] = (items[r.kind] || 0) + 1; if (r.status === 'pendiente') pending++; });
    (id.data || []).forEach(r => { ideas[r.status] = (ideas[r.status] || 0) + 1; byP[r.parish || ''] = (byP[r.parish || ''] || 0) + 1; });
    return { items, ideas, pending, byP };
  }

  async function nav() {
    const st = await stats().catch(() => ({ ideas: {} })), c = schema.collections;
    const link = (h, t, b) => `<a href="#${h}">${t}${b ? `<span class="badge">${b}</span>` : ''}</a>`;
    $('#nav').innerHTML = link('/', 'Resumen', st.pending) +
      `<div class="grp">Contenido</div>` + link('/ajustes/0', 'Textos y fotografías') + ['pillars', 'proposals', 'news', 'team', 'experience'].map(k => link('/c/' + k, c[k].label)).join('') +
      `<div class="grp">Territorio</div>` + ['parishes', 'communities', 'gallery'].map(k => link('/c/' + k, c[k].label)).join('') +
      `<div class="grp">Ciudadanía</div>` + link('/ideas', 'Ideas ciudadanas', st.ideas.nueva) +
      `<div class="grp">Sistema</div>` + link('/medios', 'Biblioteca de medios') + (isAdmin() ? link('/usuarios', 'Usuarios') : '') + link('/cuenta', 'Mi contraseña');
    const h = location.hash || '#/';
    $$('#nav a').forEach(a => { const x = a.getAttribute('href'); a.classList.toggle('on', h === x || (x !== '#/' && h.startsWith(x + '/'))); });
  }

  const route = guard(async () => {
    if (!me) return;
    $('.side').classList.remove('open'); nav(); scrollTo(0, 0);
    const p = (location.hash.slice(2) || '').split('/');
    if (p[0] === 'ajustes') return settingsView(+p[1] || 0);
    if (p[0] === 'c' && p[2]) return itemForm(p[1], p[2]);
    if (p[0] === 'c') return itemList(p[1]);
    if (p[0] === 'ideas') return ideasView();
    if (p[0] === 'medios') return mediaView();
    if (p[0] === 'usuarios') return usersView();
    if (p[0] === 'cuenta') return accountView();
    dash();
  });
  addEventListener('hashchange', route);

  // ---------------- campos
  function field(f, v) {
    v = v ?? '';
    const req = f.required ? ' required' : '', lbl = esc(f.label) + (f.required ? ' *' : '');
    const opts = (list, empty) => (empty !== undefined ? `<option value="">${empty}</option>` : '') + list.map(([k, t]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(t)}</option>`).join('');
    switch (f.type) {
      case 'textarea': return `<label class="textarea">${lbl}<textarea name="${f.name}" rows="${/body|bio_text|description/.test(f.name) ? 9 : 4}"${req}>${esc(v)}</textarea></label>`;
      case 'bool': return `<label class="chk full"><input type="checkbox" name="${f.name}"${v ? ' checked' : ''}> ${lbl}</label>`;
      case 'select': return `<label>${lbl}<select name="${f.name}">${opts(f.options)}</select></label>`;
      case 'parish': return `<label>${lbl}<select name="${f.name}">${opts(schema.parishes, f.required ? undefined : 'Todo el cantón')}</select></label>`;
      case 'category': { const cs = cats().map(c => [c, c]); if (v && !cats().includes(v)) cs.push([v, v]); return `<label>${lbl}<select name="${f.name}">${opts(cs, '—')}</select></label>`; }
      case 'image': case 'video': {
        const prev = f.type === 'image' ? `<img src="${esc(src(v)) || 'data:,'}" alt="">` : `<video src="${esc(src(v))}" muted></video>`;
        return `<div class="media" data-type="${f.type}">${prev}<div class="mf"><b>${lbl}</b><input name="${f.name}" value="${esc(v)}" placeholder="Sube un archivo o pega una URL https://"${req}>
          <div class="mb"><label class="btn sm g">Subir ${f.type === 'image' ? 'imagen' : 'video'}<input type="file" hidden accept="${f.type === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm'}"></label><button type="button" class="btn sm g clr">Quitar</button></div></div></div>`;
      }
      default: return `<label>${lbl}<input name="${f.name}" type="${{ url: 'url', email: 'email', date: 'date' }[f.type] || 'text'}" value="${esc(v)}"${req}></label>`;
    }
  }
  function bindMedia(root) {
    $$('.media', root).forEach(m => {
      const inp = $('input[name]', m), prev = $('img,video', m);
      const sync = () => { prev.src = src(inp.value) || (prev.tagName === 'IMG' ? 'data:,' : ''); };
      inp.addEventListener('change', sync);
      $('.clr', m).onclick = () => { inp.value = ''; sync(); };
      $('input[type=file]', m).addEventListener('change', guard(async e => {
        const file = e.target.files[0]; if (!file) return;
        toast('Subiendo…'); inp.value = await upload(file); sync(); toast('Archivo subido');
      }));
    });
  }
  // Portada automática: si se pega un enlace de Facebook, Instagram o TikTok y no hay imagen, se descarga la portada pública.
  function bindSocial(form) {
    const img = form.elements.image, urls = ['video_url', 'link'].map(n => form.elements[n]).filter(Boolean);
    if (!img || !urls.length) return;
    const pick = () => urls.map(u => u.value.trim()).find(v => APP.social(v));
    const fetchCover = async u => {
      toast('Obteniendo la portada de la publicación…');
      const { data, error } = await sb.functions.invoke('portada', { body: { url: u } });
      if (error || !(data instanceof Blob) || !data.type.startsWith('image/')) {
        let msg = ''; try { msg = (await error?.context?.json())?.error || ''; } catch { }
        throw new Error((msg ? msg + '. ' : '') + 'No se pudo obtener la portada automáticamente; puedes subir una imagen.');
      }
      img.value = await upload(new File([data], 'portada', { type: data.type })); img.dispatchEvent(new Event('change')); toast('Portada agregada');
    };
    urls.forEach(u => u.addEventListener('change', guard(async () => { const v = pick(); if (v && !img.value.trim()) await fetchCover(v); })));
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm g'; b.textContent = 'Portada desde el enlace';
    b.onclick = guard(async () => { const v = pick(); if (!v) throw new Error('Primero pega un enlace de Facebook, Instagram o TikTok.'); await fetchCover(v); });
    img.closest('.media').querySelector('.mb').append(b);
  }
  function collect(form, fields) {
    const out = {};
    for (const f of fields) {
      const el = form.elements[f.name];
      if (f.type === 'bool') { out[f.name] = el.checked ? '1' : ''; continue; }
      const v = el.value.trim();
      const bad = v && ((f.type === 'url' && !/^https?:\/\//i.test(v)) || (['image', 'video'].includes(f.type) && !/^(https:\/\/|assets\/)/i.test(v)) ||
        (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) || (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)));
      if (bad) throw new Error(`El campo «${f.label}» no es válido.`);
      if (f.required && !v) throw new Error(`El campo «${f.label}» es obligatorio.`);
      out[f.name] = v;
    }
    return out;
  }

  // ---------------- subida optimizada de archivos
  // Decodifica cualquier imagen (PNG, JPG, WebP; también PNG de 16 bits o con perfil de color en Safari).
  const decode = async file => {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { }
    try { return await createImageBitmap(file); } catch { }
    const url = URL.createObjectURL(file);
    try { const im = new Image(); im.src = url; await im.decode(); return im; }
    catch { throw new Error('No se pudo leer la imagen. Ábrela y guárdala de nuevo como PNG o JPG.'); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 60000); }
  };
  const blobOf = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
  // Reduce y convierte a WebP; si el navegador no sabe WebP usa JPG (o PNG si la imagen tiene transparencia).
  const shrink = async (img, max, q) => {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    for (let m = max; m >= 600; m = Math.round(m * .7)) {
      const k = Math.min(1, m / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
      let b = await blobOf(c, 'image/webp', q);
      if (b && b.type !== 'image/webp') {
        const d = x.getImageData(0, 0, c.width, c.height).data; let alpha = false;
        for (let i = 3; i < d.length; i += 16) if (d[i] < 250) { alpha = true; break; }
        b = alpha ? await blobOf(c, 'image/png') : await blobOf(c, 'image/jpeg', .86);
      }
      if (b) return b;
    }
    throw new Error('La imagen es demasiado grande para procesarla. Redúcela e inténtalo de nuevo.');
  };
  const EXT = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif' };
  const typeOf = f => /^image\/(jpeg|png|webp|gif)$/.test(f.type) ? f.type : f.type === 'image/x-png' ? 'image/png' :
    ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' })[(f.name.split('.').pop() || '').toLowerCase()] || '';
  async function upload(file) {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16), bucket = sb.storage.from('media');
    const put = async (path, body, type) => { ok(await bucket.upload(path, body, { contentType: type, cacheControl: '31536000', upsert: false })); return bucket.getPublicUrl(path).data.publicUrl; };
    if (/^video\/(mp4|webm)$/.test(file.type)) {
      if (file.size > 50 * 1024 * 1024) throw new Error('El video supera 50 MB. Súbelo a YouTube o Facebook y pega el enlace.');
      return put(`video/${id}.${file.type.split('/')[1]}`, file, file.type);
    }
    const type = typeOf(file);
    if (!type) throw new Error('Formato no permitido. Usa PNG, JPG, WebP o GIF.');
    if (type === 'image/gif') return put(`img/${id}.gif`, file, 'image/gif');
    const img = await decode(file);
    const big = await shrink(img, 2200, .84), small = await shrink(img, 760, .8);
    await put(`img/${id}_t.${EXT[small.type]}`, small, small.type);
    return put(`img/${id}.${EXT[big.type]}`, big, big.type);
  }

  // ---------------- resumen
  async function dash() {
    const st = await stats(), c = schema.collections;
    const card = (n, t, h) => `<a class="stat" href="#${h}"><b>${n || 0}</b><span>${t}</span></a>`;
    view.innerHTML = `<div class="bar"><h1>Hola 👋</h1><a class="btn y" href="../" target="_blank">Ver sitio público ↗</a></div>
      <div class="stats">${card(st.pending, 'Publicaciones pendientes de aprobar', '/c/proposals')}${card(st.ideas.nueva, 'Ideas ciudadanas nuevas', '/ideas')}
      ${['proposals', 'news', 'team', 'gallery'].map(k => card(st.items[k], c[k].label, '/c/' + k)).join('')}</div>
      <div class="panel"><h3>Ideas ciudadanas por parroquia</h3><div class="stats">${[['', 'Todo el cantón'], ...schema.parishes].map(([k, t]) => card(st.byP[k], t, '/ideas')).join('')}</div></div>
      <div class="panel"><h3>Primeros pasos</h3><ol class="muted"><li>Revisa portada, biografía y logotipos en <a href="#/ajustes/0">Textos y fotografías</a>.</li><li>Agrega Facebook, WhatsApp, Instagram y TikTok en la pestaña <a href="#/ajustes/8">Contacto</a>.</li><li>Publica propuestas por parroquia y sube las fotos del equipo.</li><li>Todo lo que guardes se publica al instante en el sitio.</li></ol></div>`;
  }

  // ---------------- textos y fotografías
  async function settingsView(i) {
    settingsCache = Object.fromEntries(ok(await sb.from('settings').select('k,v')).map(r => [r.k, r.v]));
    const [title, fields] = schema.settings[i];
    view.innerHTML = `<div class="bar"><h1>Textos y fotografías</h1></div>
      <div class="tabs">${schema.settings.map(([t], j) => `<a href="#/ajustes/${j}" class="${j === i ? 'on' : ''}">${esc(t)}</a>`).join('')}</div>
      <form class="panel form">${fields.map(f => field(f, settingsCache[f.name])).join('')}<div class="full"><button class="btn">Guardar ${esc(title)}</button></div></form>`;
    const form = $('form', view); bindMedia(form);
    form.onsubmit = guard(async e => {
      e.preventDefault();
      const data = collect(form, fields);
      ok(await sb.from('settings').upsert(Object.entries(data).map(([k, v]) => ({ k, v }))));
      Object.assign(settingsCache, data); toast('Cambios guardados y publicados');
    });
  }

  // ---------------- colecciones
  async function itemList(kind) {
    const c = schema.collections[kind]; if (!c) return dash();
    const items = ok(await sb.from('items').select('*').eq('kind', kind).order('sort').order('id', { ascending: false })).map(r => ({ ...r.data, id: r.id, status: r.status, sort: r.sort }));
    const stf = sessionStorage.getItem('f_' + kind) || '';
    const imgOf = it => it.image || it.photo || it.cover || it.sub1_image || '';
    const draw = flt => {
      $('.list', view).innerHTML = items.filter(it => !flt || it.status === flt).map(it => `<div class="row">${imgOf(it) ? `<img src="${esc(src(imgOf(it)))}" alt="" loading="lazy">` : '<div class="noimg"></div>'}
        <div><h3>${esc(it[c.title] || '(sin título)')}<span class="st ${it.status}">${it.status}</span></h3><small>${[it.parish !== undefined ? pname(it.parish) : '', it.category, it.date, it.role, it.period].filter(Boolean).map(esc).join(' · ')} · Orden ${it.sort}</small></div>
        <div class="acts">${isAdmin() && it.status !== 'publicado' ? `<button class="btn sm ok" data-st="publicado" data-id="${it.id}">Aprobar</button>` : ''}${isAdmin() && it.status !== 'rechazado' && !c.fixed ? `<button class="btn sm g" data-st="rechazado" data-id="${it.id}">Rechazar</button>` : ''}
        <a class="btn sm" href="#/c/${kind}/${it.id}">Editar</a>${isAdmin() && !c.fixed ? `<button class="btn sm bad" data-del="${it.id}">Eliminar</button>` : ''}</div></div>`).join('') || '<p class="muted panel">No hay elementos todavía.</p>';
    };
    view.innerHTML = `<div class="bar"><h1>${esc(c.label)}</h1><div class="filters"><select class="sf"><option value="">Todos los estados</option>${STATUSES.map(s => `<option${s === stf ? ' selected' : ''}>${s}</option>`).join('')}</select>${c.fixed ? '' : `<a class="btn y" href="#/c/${kind}/new">+ Nuevo</a>`}</div></div><div class="list"></div>`;
    draw(stf);
    $('.sf', view).onchange = e => { sessionStorage.setItem('f_' + kind, e.target.value); draw(e.target.value); };
    $('.list', view).onclick = guard(async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.st) { ok(await sb.from('items').update({ status: b.dataset.st }).eq('id', b.dataset.id)); toast(b.dataset.st === 'publicado' ? 'Publicado' : 'Rechazado'); }
      if (b.dataset.del) { if (!confirm('¿Eliminar definitivamente este elemento?')) return; ok(await sb.from('items').delete().eq('id', b.dataset.del)); toast('Eliminado'); }
      itemList(kind); nav();
    });
  }

  async function itemForm(kind, id) {
    const c = schema.collections[kind]; if (!c) return dash();
    let it = { status: isAdmin() ? 'publicado' : 'pendiente', sort: 0 };
    if (id !== 'new') { const r = ok(await sb.from('items').select('*').eq('id', id).maybeSingle()); if (!r) return itemList(kind); it = { ...r.data, status: r.status, sort: r.sort, _data: r.data }; }
    const stSel = isAdmin() ? `<label>Estado<select name="status">${STATUSES.map(s => `<option${s === it.status ? ' selected' : ''}>${s}</option>`).join('')}</select></label>`
      : `<p class="muted full">Tus cambios quedarán <b>pendientes</b> hasta que un administrador los apruebe.</p>`;
    view.innerHTML = `<div class="bar"><h1>${id === 'new' ? 'Nuevo' : 'Editar'} · ${esc(c.label)}</h1><a class="btn g" href="#/c/${kind}">← Volver</a></div>
      <form class="panel form">${c.fields.map(f => field(f, it[f.name])).join('')}${stSel}<label>Orden (menor aparece primero)<input type="number" name="sort" value="${+it.sort || 0}"></label>
      <div class="full"><button class="btn">Guardar</button></div></form>`;
    const form = $('form', view); bindMedia(form); bindSocial(form);
    form.onsubmit = guard(async e => {
      e.preventDefault();
      const data = { ...(it._data || {}), ...collect(form, c.fields) };
      const row = { data, sort: parseInt(form.sort.value, 10) || 0, status: form.status?.value || 'pendiente' };
      if (id === 'new') ok(await sb.from('items').insert({ kind, ...row })); else ok(await sb.from('items').update(row).eq('id', id));
      toast('Guardado'); location.hash = '#/c/' + kind;
    });
  }

  // ---------------- ideas ciudadanas
  async function ideasView() {
    const q = JSON.parse(sessionStorage.getItem('fi') || '{"status":"*","parish":"*","category":"*","q":""}');
    const opt = (list, val) => list.map(([k, t]) => `<option value="${esc(k)}"${k === val ? ' selected' : ''}>${esc(t)}</option>`).join('');
    view.innerHTML = `<div class="bar"><h1>Ideas ciudadanas</h1>${isAdmin() ? '<button class="btn g csv">Exportar CSV</button>' : ''}</div>
      <form class="filters panel">
        <select name="status">${opt([['*', 'Todos los estados'], ...IDEA_ST.map(s => [s, s])], q.status)}</select>
        <select name="parish">${opt([['*', 'Todas las parroquias'], ['', 'Todo el cantón'], ...schema.parishes], q.parish)}</select>
        <select name="category">${opt([['*', 'Todas las categorías'], ['', 'Sin categoría'], ...cats().map(c => [c, c])], q.category)}</select>
        <input name="q" placeholder="Buscar…" value="${esc(q.q)}"></form>
      <p class="muted">Los datos personales son confidenciales: nunca se muestran en el sitio público. Al aprobar una idea solo se publica el mensaje, el tema y la parroquia.</p>
      <div class="list ideas"></div>`;
    const form = $('form', view); let rows = [];
    const load = guard(async () => {
      const f = Object.fromEntries(new FormData(form)); sessionStorage.setItem('fi', JSON.stringify(f));
      let qb = sb.from('ideas').select('id,name,cedula,phone,email,parish,category,message,status,note,created').order('id', { ascending: false });
      if (f.status !== '*') qb = qb.eq('status', f.status);
      if (f.parish !== '*') qb = f.parish ? qb.eq('parish', f.parish) : qb.is('parish', null);
      if (f.category !== '*') qb = f.category ? qb.eq('category', f.category) : qb.or('category.is.null,category.eq.');
      const term = f.q.replace(/[,()%*]/g, ' ').trim();
      if (term) qb = qb.or(['message', 'name', 'email', 'phone', 'cedula'].map(c => `${c}.ilike.*${term}*`).join(','));
      rows = ok(await qb);
      $('.ideas', view).innerHTML = rows.map(r => `<article class="idea" data-id="${r.id}">
        <div><b>#${r.id}</b> <span class="st ${r.status}">${r.status}</span> <small class="muted">${new Date(r.created).toLocaleString('es-EC')}</small></div>
        <div class="pdata"><span><b>Nombre:</b> ${esc(r.name) || '—'}</span><span><b>Cédula:</b> ${esc(r.cedula) || '—'}</span><span><b>Celular:</b> ${r.phone ? `<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>` : '—'}</span><span><b>Correo:</b> ${r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>` : '—'}</span></div>
        <div class="msg">${esc(r.message)}</div>
        <div class="ctl"><select data-k="parish">${opt([['', 'Todo el cantón'], ...schema.parishes], r.parish || '')}</select>
          <select data-k="category">${opt([['', 'Sin categoría'], ...cats().map(c => [c, c]), ...(r.category && !cats().includes(r.category) ? [[r.category, r.category]] : [])], r.category || '')}</select>
          <input data-k="note" placeholder="Nota interna" value="${esc(r.note)}" class="grow">
          ${isAdmin() ? `${r.status !== 'aprobada' ? '<button class="btn sm ok" data-st="aprobada">Aprobar</button>' : ''}${r.status !== 'rechazada' ? '<button class="btn sm g" data-st="rechazada">Rechazar</button>' : ''}<button class="btn sm bad" data-del>Eliminar</button>` : ''}</div></article>`).join('') || '<p class="panel muted">No hay ideas con estos filtros.</p>';
    });
    form.onchange = load; form.oninput = e => { if (e.target.name === 'q') { clearTimeout(form._t); form._t = setTimeout(load, 350); } }; form.onsubmit = e => { e.preventDefault(); load(); };
    $('.ideas', view).addEventListener('change', guard(async e => {
      const k = e.target.dataset.k; if (!k) return;
      ok(await sb.from('ideas').update({ [k]: e.target.value || null }).eq('id', e.target.closest('.idea').dataset.id)); toast('Actualizado');
    }));
    $('.ideas', view).addEventListener('click', guard(async e => {
      const b = e.target.closest('button'); if (!b) return; const id = b.closest('.idea').dataset.id;
      if (b.dataset.st) ok(await sb.from('ideas').update({ status: b.dataset.st }).eq('id', id));
      if (b.hasAttribute('data-del')) { if (!confirm('¿Eliminar esta idea y sus datos personales?')) return; ok(await sb.from('ideas').delete().eq('id', id)); }
      toast('Hecho'); load(); nav();
    }));
    $('.csv', view) && ($('.csv', view).onclick = () => {
      const cols = ['id', 'created', 'status', 'parish', 'category', 'name', 'cedula', 'phone', 'email', 'message', 'note'];
      const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = '﻿' + [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ideas-ciudadanas.csv'; a.click();
    });
    load();
  }

  // ---------------- medios
  async function mediaView() {
    const bucket = sb.storage.from('media');
    const [img, vid] = await Promise.all(['img', 'video'].map(d => bucket.list(d, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })));
    const files = [...(img.data || []).filter(f => !/_t\.(webp|jpg|png)$/.test(f.name)).map(f => ({ path: 'img/' + f.name, type: 'image' })), ...(vid.data || []).map(f => ({ path: 'video/' + f.name, type: 'video' }))]
      .filter(f => !f.path.endsWith('.emptyFolderPlaceholder'));
    const pub = p => bucket.getPublicUrl(p).data.publicUrl;
    view.innerHTML = `<div class="bar"><h1>Biblioteca de medios</h1><label class="btn y">+ Subir fotos o videos<input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"></label></div>
      <p class="muted">Las imágenes se optimizan automáticamente (WebP en alta resolución + miniatura). Copia la dirección de un archivo para usarlo en cualquier sección.</p>
      <div class="grid-media">${files.map(m => `<div class="mi">${m.type === 'video' ? `<video src="${esc(pub(m.path))}" muted preload="metadata"></video>` : `<img src="${esc(pub(m.path.replace(/\.(webp|jpg|png)$/, '_t.$1')))}" alt="" loading="lazy">`}
        <div><button class="btn sm g" data-copy="${esc(pub(m.path))}">Copiar URL</button>${isAdmin() ? `<button class="btn sm bad" data-del="${esc(m.path)}">×</button>` : ''}</div></div>`).join('') || '<p class="muted">Aún no hay archivos.</p>'}</div>`;
    $('input[type=file]', view).onchange = guard(async e => {
      for (const file of e.target.files) { toast('Subiendo ' + file.name + '…'); await upload(file); }
      toast('Archivos subidos'); mediaView();
    });
    $('.grid-media', view).onclick = guard(async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.copy) { await navigator.clipboard.writeText(b.dataset.copy).catch(() => prompt('Copia la URL:', b.dataset.copy)); toast('URL copiada'); }
      if (b.dataset.del) {
        if (!confirm('¿Eliminar el archivo? Si está en uso, dejará de mostrarse.')) return;
        const p = b.dataset.del; ok(await bucket.remove(/\.(webp|jpg|png)$/.test(p) ? [p, p.replace(/\.(webp|jpg|png)$/, '_t.$1')] : [p])); mediaView();
      }
    });
  }

  // ---------------- usuarios y contraseña
  async function usersView() {
    const rows = ok(await sb.from('staff').select('user_id,email,role,created').order('created'));
    view.innerHTML = `<div class="bar"><h1>Usuarios autorizados</h1></div>
      <div class="list">${rows.map(u => `<div class="row"><div class="noimg"></div><div><h3>${esc(u.email)}<span class="st ${u.role === 'admin' ? 'publicado' : 'pendiente'}">${u.role}</span></h3><small>Desde ${new Date(u.created).toLocaleDateString('es-EC')}</small></div><div class="acts">${u.user_id !== me.id ? `<button class="btn sm bad" data-del="${esc(u.email)}">Quitar acceso</button>` : ''}</div></div>`).join('')}</div>
      <form class="panel form mt"><h3 class="full">Dar acceso a otra persona</h3>
      <p class="muted full">1) Crea su cuenta en Supabase → Authentication → Users → <b>Add user</b> (correo y contraseña). 2) Escribe aquí su correo y el rol.</p>
      <label>Correo<input name="email" type="email" required></label><label>Rol<select name="role"><option value="editor">Editor (sus cambios requieren aprobación)</option><option value="admin">Administrador</option></select></label>
      <div class="full"><button class="btn">Dar acceso</button></div></form>`;
    $('form', view).onsubmit = guard(async e => { e.preventDefault(); const f = e.target; ok(await sb.rpc('set_staff_role', { p_email: f.email.value, p_role: f.role.value })); toast('Acceso concedido'); usersView(); });
    $('.list', view).onclick = guard(async e => { const b = e.target.closest('[data-del]'); if (!b || !confirm('¿Quitar el acceso a este usuario?')) return; ok(await sb.rpc('set_staff_role', { p_email: b.dataset.del, p_role: 'ninguno' })); usersView(); });
  }
  function accountView() {
    view.innerHTML = `<div class="bar"><h1>Cambiar mi contraseña</h1></div><form class="panel form">
      <label>Nueva contraseña<input name="new" type="password" autocomplete="new-password" required></label><label>Repite la nueva contraseña<input name="rep" type="password" autocomplete="new-password" required></label><div class="full"><button class="btn">Actualizar</button></div></form>`;
    $('form', view).onsubmit = guard(async e => {
      e.preventDefault(); const f = e.target, p = f.new.value;
      if (p !== f.rep.value) throw new Error('Las contraseñas no coinciden.');
      if (p.length < 10 || !/[A-Za-z]/.test(p) || !/\d/.test(p)) throw new Error('Usa al menos 10 caracteres, con letras y números.');
      ok(await sb.auth.updateUser({ password: p })); f.reset(); toast('Contraseña actualizada');
    });
  }

  boot();
})();
