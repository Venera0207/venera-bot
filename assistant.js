/* ============================================================
   VENERA ASSISTANT — общий движок ИИ-ассистента для обоих сайтов
   • Живёт прямо на сайте: отвечает МГНОВЕННО из локальной базы знаний,
     без Telegram и без VPN.
   • Сложные вопросы передаёт нейросети через Google Apps Script (JSONP);
     если она думает долго — честно предупреждает и ждёт вместе с клиентом.
   • Заявки (формы и чат) уходят в мини-CRM (Google-таблица) с уведомлением
     в Telegram Венеры — тем же PIPE, что уже работает.
   • Сам добавляет виджет-чат на страницы, где нет родного чата (портфолио).
   РЕДАКТИРОВАНИЕ ОТВЕТОВ: блок KB ниже — просто добавляйте строки.
   ============================================================ */
(function () {
  'use strict';

  var PIPE_URL = 'https://script.google.com/macros/s/AKfycbySBX4LcBbZm_PzSUvYIPXDqwRphZQgFWiEnhGteizA9RLnIcDmFZcjRZrZ8nfu_i6d/exec';

  /* ------------------------------------------------------------
     ЛОКАЛЬНАЯ БАЗА ЗНАНИЙ: мгновенные ответы без сети.
     k — ключевые слова (подстроки, регистр и «ё» не важны), a — ответ.
     ------------------------------------------------------------ */
  var KB = [
    { k: ['здравств', 'привет', 'добрый день', 'добрый вечер', 'доброй ночи', 'хай'], s: 1,
      a: 'Здравствуйте! Я ИИ-ассистент Венеры. Рассказываю про услуги, цены, сроки и процесс работы. Опишите задачу своими словами или спросите то, что интересно.' },
    { k: ['спасибо', 'благодар'], s: 1,
      a: 'Пожалуйста! Я всегда на связи. А для личной консультации напишите Венере через форму на сайте или в Telegram.' },
    { k: ['цена', 'стоим', 'сколько стоит', 'дорого', 'бюджет', 'прайс', 'ценник', 'рубл'], c: 1,
      a: 'Коротко о ценах: лендинг на чистом коде — от 30 000 ₽ (3-7 дней); всё, что думает, считает и общается — калькуляторы, каталоги с админкой, чат-боты, ИИ-ассистенты — от 30 000 ₽; карточки Ozon/WB — от 2 000 ₽. Связка лендинг + ИИ-ассистент: 30 000 + 30 000 = 60 000, но связкой — от 55 000 ₽; лендинг + чат-бот + админка — от 80 000 ₽ (10 дней до 3 недель). Окончательная цена формируется из конкретного заказа и озвучивается Венерой лично.' },
    { k: ['связк', 'лендинг с ассистент', 'сайт с ассистент', 'лендинг плюс', 'всё вместе', 'под ключ', 'вместе с чат', 'вместе с бот', 'с чат-ботом', 'с ботом', 'плюс чат', 'плюс бот', 'сколько вместе', 'вместе стоим', 'визитка с'], c: 1,
      a: 'Связка лендинг + ИИ-ассистент складывается так: 30 000 ₽ лендинг + 30 000 ₽ ассистент = 60 000 ₽, но связкой — от 55 000 ₽, срок 7-10 дней. Ассистент при этом настраивается под ваши материалы и живёт прямо на странице. Окончательная цена формируется из конкретного заказа и озвучивается Венерой лично.' },
    { k: ['лендинг', 'одностранич', 'landing', 'лендос'], c: 1,
      a: 'Лендинг на чистом коде — от 30 000 ₽: одна страница, уникальный дизайн, быстрая загрузка, без конструкторов. Срок 3-7 дней. Интеграции, калькуляторы и каталоги в эту цену не входят — это отдельные услуги.' },
    { k: ['визитк', 'мини-сайт', 'сайт-визитка', 'сайт для', 'небольшой сайт'], c: 1,
      a: 'Да, Венера делает сайты-визитки и мини-сайты: по сути лендинг с уникальным дизайном — от 30 000 ₽, срок 3-7 дней. Для мастера маникюра, парикмахера или любого специалиста это идеальный формат: контакты, примеры работ, цены и кнопка записи. Точная цена — после короткого брифа.' },
    { k: ['бот каталог', 'сайт чат', 'каталог и бот', 'сайт с каталогом и', 'комплексный проект', 'сайт плюс бот', 'админк', 'админкой', 'с админкой', 'чат бот админк', 'лендинг чат бот'], c: 1,
      a: 'Сайт с админкой — от 80 000 ₽ в связке «лендинг + чат-бот + админка», срок от 10 дней до 3 недель в зависимости от сложности: числа объектов, страниц и интеграций. Если чат-бот не нужен — будет несколько дешевле, точную смету Венера назовёт после короткого брифа.' },
    { k: ['бот', 'ассистент', 'агент', 'нейросет', 'ии-', 'ии ', 'ai', 'чат-бот', 'умный помощник'], c: 1,
      a: 'Венера создаёт ИИ-ассистентов и чат-ботов: они консультируют клиентов на сайте и в мессенджерах, собирают заявки и работают круглосуточно — от 30 000 ₽ (в связке с лендингом — от 55 000 ₽, срок 7-10 дней). Кстати, я и есть такой ассистент — можете тестировать меня сколько угодно.' },
    { k: ['каталог', 'корпоратив', 'витрин', 'интернет-магазин'], c: 1,
      a: 'Сайты и каталоги с админкой Венера делает вручную, на чистом коде: сайт принадлежит вам, без ежемесячной платы платформе. Проекты с каталогом и админкой — от 80 000 ₽, сроки таких проектов — от 10 дней до 3 недель, точная цена и график после короткого брифа.' },
    { k: ['ozon', 'wb', 'wildberries', 'озон', 'валдберис', 'вайлдберриз', 'карточк товар'], c: 1,
      a: 'Карточки товаров для Ozon и Wildberries — от 2 000 ₽ за карточку: дизайн, который повышает конверсию.' },
    { k: ['редизайн', 'обновить сайт', 'передела', 'старый сайт'], c: 1,
      a: 'Редизайн — обновление визуальной системы и интерфейса без потери смысла и наработок. Цена — после просмотра текущего сайта, ориентировочно от 30 000 ₽.' },
    { k: ['на тильде сайт сделаете', 'сделаете на тильде', 'на тильде сделаете', 'на тильде возьметесь'], e: 1,
      a: 'Венера работает только с чистым кодом, без конструкторов, и цены начинаются от 30 000 ₽. Но я сейчас спрошу у неё лично про ваш вопрос.' },
    { k: ['сделаете за', 'за 5000', 'за пять тысяч', 'скидк', 'дешевл', 'подешев', 'торг', 'а подешевле'], e: 1,
      a: 'Цены Венеры начинаются от 30 000 ₽ за лендинг и от 30 000 ₽ за решения с ИИ — это честная цена без завышений. Но ваше пожелание я передам Венере лично прямо сейчас.' },
    { k: ['тильд', 'tilda', 'wix', 'викс', 'конструктор', 'таплик', 'на тильде', 'отлич', 'разниц', 'почему не', 'что лучше', 'плюсы', 'минусы'],
      a: 'Главные отличия сайта на чистом коде от конструктора (Tilda, Wix): 1) Скорость — нет тяжёлого слоя платформы, страницы открываются быстрее. 2) Собственность — сайт ваш навсегда, без ежемесячной платы платформе. 3) Уникальность — дизайн собирается под ваш бизнес, а не из шаблона, как у тысяч других. 4) Свобода — код можно перенести на любой хостинг и дорабатывать без ограничений платформы. 5) Любая функциональность — каталоги, калькуляторы, ИИ-ассистенты; конструктор упирается в свои готовые блоки. Поэтому Венера и работает без конструкторов.' },
    { k: ['срок', 'как быстро', 'когда будет готов', 'длительн', 'время выполн', 'как долго', 'сколько времени', 'сколько дней', 'как скоро', 'когда сдела'], c: 1,
      a: 'Сроки: простой лендинг — 3-7 дней; лендинг + чат-бот — 7-10 дней; лендинг + чат-бот + админка — от 10 дней до 3 недель в зависимости от сложности. Точный срок Венера называет после короткого брифа.' },
    { k: ['оплат', 'рассроч', 'предоплат', 'частям', 'как платит'], c: 1,
      a: 'Оплата обсуждается индивидуально, по большим проектам возможна рассрочка — например, двумя платежами. Все условия фиксируются до начала работ.' },
    { k: ['портфолио', 'пример', 'работ', 'кейс', 'готовые сайт', 'посмотреть сайт'],
      a: 'В портфолио Венеры уже больше семи проектов: от лендинга сладкой студии до сайта юридических услуг и редизайнов. Ссылки на живые работы — в разделе «Проекты» на этом сайте.' },
    { k: ['контакт', 'связаться', 'телефон', 'почта', 'email', 'емейл', 'телеграм', 'ватсап', 'whatsapp', 'написать венер'],
      a: 'Связаться можно так: форма на сайте (заявка приходит Венере сразу с уведомлением), Telegram — кнопка на сайте, почта venera.web.4@gmail.com, телефон +7 931 357-96-00. Или просто опишите задачу здесь, в чате, — я передам.' },
    { k: ['кто ты', 'кто вы', 'о себе', 'расскажи о себе', 'опыт', 'ты кто'],
      a: 'Я — ИИ-ассистент на сайте Венеры Тенюшевой: веб-разработчик и специалист по ИИ. Сайты — только на чистом коде, без конструкторов; в портфолио больше семи готовых проектов.' },
    { k: ['начать', 'старт', 'как заказать', 'оформить', 'бриф', 'заявк', 'хочу сайт', 'хочу заказать'],
      a: 'Начать просто: опишите задачу в форме на сайте или прямо здесь, в чате. Венера свяжется с вами, задаст несколько вопросов брифа и назовёт цену и срок.' },
    { k: ['домен', 'хостинг', 'собствен', 'кому принадлеж', 'месячн плат', 'абонент'],
      a: 'Домен и сайт оформляются на ваше имя: это ваша собственность, а не аренда. Никаких ежемесячных платежей конструкторам — вы платите за разработку один раз.' },
    { k: ['нда', 'nda', 'конфиденц', 'неразглаш', 'тайна', 'секрет'],
      a: 'Да, по желанию Венера подписывает соглашение о конфиденциальности (NDA): ваша клиентская база, цифры и материалы никуда не передаются.' },
    { k: ['поддерж', 'после запуск', 'правк', 'доработ', 'обслужив', 'сломал'],
      a: 'Поддержка и правки после запуска обсуждаются отдельно: от разовых мелочей до полного ведения сайта. Ничего не остаётся «брошенным».' },
    { k: ['впн', 'vpn', 'телеграм не откр', 'без впн', 'не открывает'],
      a: 'VPN не нужен: я живу прямо на сайте и работаю без Telegram. Кнопка Telegram — дополнительный канал для тех, кому он удобен.' },
    { k: ['что такое нейросет', 'что такое ии', 'как ты работа', 'ты человек', 'ты робот', 'ты живой', 'кто отвечает'],
      a: 'Я — программа: база знаний, которую собрала Венера, плюс подключение к нейросети для сложных вопросов. Я не человек, но заявки передаю человеку — Венера отвечает лично.' }
  ];

  /* Сирены в Telegram: можно отключить, поставив false */
  var ALERT_ON_NOANSWER = true;  /* клиент не получил ответ нейросети */
  var ALERT_ON_ESC = true;       /* горячий коммерческий вопрос (Тильда/торг) */

  var GREETING = 'Привет! Я ИИ-ассистент Венеры. На частые вопросы отвечаю мгновенно сам, для сложных подключаю нейросеть — иногда ей нужно пару минут, я честно предупрежу. Что интересует: услуги, цены, сроки?';

  /* Мягкие крючки к контакту: не чаще одного за диалог */
  var HOOK_TAIL = 'Если актуально — могу передать наш диалог Венере: она уточнит детали и назовёт точную цену. Просто оставьте контакт.';
  var NUDGE = 'Кстати, я могу сохранить наш разговор и передать Венере, чтобы вам не пришлось пересказывать всё заново. Передать?';
  var FAREWELL = 'Рад был помочь! Если созреете обсуждать задачу — Венера в одном клике: форма на сайте или Telegram.';

  /* ------------------------------------------------------------
     СЛУЖЕБНОЕ
     ------------------------------------------------------------ */
  function norm(s) {
    return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  }
  function kbMatch(text) {
    var t = norm(text), best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      if (KB[i].s) continue; /* вежливые реплики не конкурируют с деловыми темами */
      var score = 0;
      for (var j = 0; j < KB[i].k.length; j++) {
        var kw = norm(KB[i].k[j]).replace(/^\s+|\s+$/g, '');
        if (kw && t.indexOf(kw) !== -1) score += kw.length; /* чем весомее совпадение, тем важнее тема */
      }
      if (score > bestScore) { bestScore = score; best = KB[i]; }
    }
    return best;
  }
  function socialMatch(text) {
    var t = norm(text);
    for (var i = 0; i < KB.length; i++) {
      if (!KB[i].s) continue;
      for (var j = 0; j < KB[i].k.length; j++) {
        var kw = norm(KB[i].k[j]).replace(/^\s+|\s+$/g, '');
        if (kw && t.indexOf(kw) !== -1) return KB[i];
      }
    }
    return null;
  }

  function looksLikeContact(t) {
    if (/@[a-zа-я0-9_.\-]{3,}/i.test(t)) return true;              /* @ник или e-mail */
    if ((t.match(/\d/g) || []).length >= 10) return true;           /* телефон цифрами */
    if (/\+?\d[\d\s\-()]{8,}/.test(t)) return true;              /* телефон с плюсом/скобками */
    return false;
  }

  function farewellMatch(text) {
    var t = ' ' + norm(text) + ' ';
    var kws = [' пока ', 'до свидания', 'всего доброго', 'до связи', 'прощай', 'доброй ночи'];
    for (var i = 0; i < kws.length; i++) {
      if (t.indexOf(kws[i]) !== -1) return true;
    }
    return false;
  }

  var cbCounter = 0;
  function jsonp(url, timeoutMs, handlers) {
    var cbName = '__vcb' + (++cbCounter);
    var script = document.createElement('script');
    var done = false;
    var timer = setTimeout(function () {
      if (done) return; done = true;
      cleanup(); handlers.timeout && handlers.timeout();
    }, timeoutMs);
    function cleanup() {
      clearTimeout(timer);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }
    window[cbName] = function (data) {
      if (done) return; done = true;
      cleanup(); handlers.ok && handlers.ok(data);
    };
    script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + cbName;
    script.async = true;
    script.onerror = function () {
      if (done) return; done = true;
      cleanup(); handlers.fail && handlers.fail();
    };
    document.body.appendChild(script);
  }

  /* Заявки: форма и чат -> Google-таблица + Telegram Венеры */
  window.veneraSendLead = function (payload, onOk, onFail) {
    var url = PIPE_URL +
      '?action=lead' +
      '&name=' + encodeURIComponent(payload.name || '') +
      '&contact=' + encodeURIComponent(payload.contact || '') +
      '&message=' + encodeURIComponent(payload.message || '') +
      '&source=' + encodeURIComponent(payload.source || location.hostname);
    jsonp(url, 25000, {
      ok: function (data) {
        if (data && data.ok) { sendLog(payload.contact || '', payload.message || '', 'lead'); onOk && onOk(); }
        else { onFail && onFail(); }
      },
      fail: function () { onFail && onFail(); },
      timeout: function () { onFail && onFail(); }
    });
  };

  function sendAlert(text) {
    jsonp(PIPE_URL + '?action=alert&text=' + encodeURIComponent(text), 15000, {});
  }

  function pushH(role, text) {
    state.hist.push({ role: role, text: String(text).slice(0, 400) });
    if (state.hist.length > 8) state.hist.shift();
  }
  function sendLog(client, bot, outcome) {
    jsonp(PIPE_URL + '?action=log' +
      '&page=' + encodeURIComponent(location.pathname || '') +
      '&client=' + encodeURIComponent(String(client).slice(0, 300)) +
      '&bot=' + encodeURIComponent(String(bot).slice(0, 300)) +
      '&outcome=' + encodeURIComponent(outcome), 15000, {});
  }

  /* ------------------------------------------------------------
     ИНТЕРФЕЙСЫ: родной чат (бот-сайт) или виджет (портфолио)
     ------------------------------------------------------------ */
  var ui = null;

  function makeBotUI() {
    var body = document.getElementById('chatBody');
    var typing = document.getElementById('typing');
    function scroll() { body.scrollTop = body.scrollHeight; }
    return {
      user: function (t) { add('user', t); },
      agent: function (t) { add('agent', t); },
      typing: function (on) { typing.classList.toggle('show', !!on); scroll(); },
      _input: document.getElementById('chatInput'),
      _sendBtn: document.getElementById('chatSend'),
      lock: function (on) { document.getElementById('chatSend').disabled = !!on; }
    };
    function add(role, text) {
      var div = document.createElement('div');
      div.className = 'msg ' + role;
      div.textContent = text;
      body.insertBefore(div, typing);
      scroll();
    }
  }

  function makeWidgetUI() {
    var style = document.createElement('style');
    style.textContent =
      '.va-dock{position:fixed;right:22px;bottom:22px;z-index:9998;display:flex;flex-direction:column;align-items:flex-end}' +
      '.va-btn{display:flex;align-items:center;gap:10px;border:none;border-radius:999px;padding:9px 18px 9px 10px;background:linear-gradient(90deg,#22D3EE,#7C5CFF);color:#fff;cursor:pointer;box-shadow:0 10px 30px rgba(124,92,255,.45);font-family:inherit}' +
      '.va-btn:hover{filter:brightness(1.1)}' +
      '.va-btn b{display:block;font-size:14px;text-align:left;line-height:1.15}' +
      '.va-btn i{display:flex;align-items:center;gap:5px;font-style:normal;font-size:10.5px;opacity:.95}' +
      '.va-dot{width:7px;height:7px;border-radius:50%;background:#7CFC9A}' +
      '.va-ico svg{width:36px;height:36px;display:block}' +
      '.va-bubble{position:absolute;bottom:calc(100% + 12px);right:0;width:252px;background:#14141F;border:1px solid rgba(124,92,255,.55);border-radius:14px;padding:12px 26px 12px 14px;color:#EDEDF2;font-size:12.5px;line-height:1.45;display:none;box-shadow:0 12px 32px rgba(0,0,0,.5);cursor:pointer}' +
      '.va-bubble.show{display:block}' +
      '.va-bubble .x{position:absolute;top:5px;right:7px;background:none;border:none;color:#8b8b9a;cursor:pointer;font-size:14px;line-height:1}' +
      '.va-bubble::after{content:"";position:absolute;right:26px;bottom:-7px;width:12px;height:12px;background:#14141F;border-right:1px solid rgba(124,92,255,.55);border-bottom:1px solid rgba(124,92,255,.55);transform:rotate(45deg)}' +
      '.va-panel{position:fixed;right:22px;bottom:104px;width:340px;max-width:calc(100vw - 32px);height:460px;max-height:calc(100vh - 120px);background:#0A0A12;color:#eee;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.45);display:none;flex-direction:column;overflow:hidden;z-index:9999;font-family:inherit}' +
      '.va-panel.open{display:flex}' +
      '.va-panel.va-inline-panel{position:static;width:100%;height:520px;max-height:none;box-shadow:none;border:1px solid rgba(124,92,255,.35)}' +
      '.va-head{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12)}' +
      '.va-head .n{font-weight:700;font-size:14px}.va-head .s{font-size:11px;color:#22D3EE}' +
      '.va-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}' +
      '.va-msg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.45;white-space:pre-wrap}' +
      '.va-msg.agent{background:rgba(255,255,255,.1);align-self:flex-start}' +
      '.va-msg.user{background:#7C5CFF;color:#fff;align-self:flex-end}' +
      '.va-typing{display:none;padding:0 16px 10px;font-size:11px;color:#8b8b9a}' +
      '.va-typing.show{display:block}' +
      '.va-input{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.12)}' +
      '.va-input input{flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px;color:#fff;font-size:13px}' +
      '.va-input button{border:none;border-radius:10px;background:#7C5CFF;color:#fff;padding:10px 14px;cursor:pointer;font-weight:600}' +
      '@media (max-width:480px){.va-btn i{display:none}.va-btn b{font-size:13px}.va-bubble{width:210px}}';
    document.head.appendChild(style);

    var dock = document.createElement('div');
    dock.className = 'va-dock';
    var bubble = document.createElement('div');
    bubble.className = 'va-bubble';
    bubble.innerHTML = '<button class="x" aria-label="Закрыть">✕</button><span class="t"></span>';
    var btn = document.createElement('button');
    btn.className = 'va-btn'; btn.setAttribute('aria-label', 'Чат с ИИ-ассистентом');
    btn.innerHTML = '<span class="va-ico"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M14 32 q-7 3 -8 10" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50 26 q9 -7 10 -13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="11" r="4.5" fill="#fff"/><rect x="28" y="6" width="8" height="7" rx="3" fill="#fff"/><circle cx="32" cy="5" r="3" fill="#FFE066"/><rect x="14" y="14" rx="10" width="36" height="32" fill="#fff"/><circle cx="26" cy="29" r="4" fill="#0A0A12"/><circle cx="40" cy="29" r="4" fill="#0A0A12"/><path d="M25 38 q7 6 14 0" stroke="#0A0A12" stroke-width="3" fill="none" stroke-linecap="round"/></svg></span>' +
      '<span class="va-lbl"><b>Спросить ассистента</b><i><span class="va-dot"></span>на связи · отвечает без VPN</i></span>';
    dock.appendChild(bubble);
    dock.appendChild(btn);
    var panel = document.createElement('div');
    panel.className = 'va-panel';
    panel.innerHTML =
      '<div class="va-head"><div class="n">ИИ-ассистент Венеры</div><div class="s">на связи · отвечает без VPN</div></div>' +
      '<div class="va-body"></div>' +
      '<div class="va-typing">ассистент печатает…</div>' +
      '<div class="va-input"><input type="text" placeholder="Напишите сообщение…" autocomplete="off"><button>Отправить</button></div>';
    var host = document.getElementById('va-inline');
    var inline = !!host;
    document.body.appendChild(dock);
    if (inline) {
      panel.classList.add('open', 'va-inline-panel');
      host.appendChild(panel);
    } else {
      document.body.appendChild(panel);
    }

    var bodyEl = panel.querySelector('.va-body');
    var typingEl = panel.querySelector('.va-typing');
    var input = panel.querySelector('.va-input input');
    var sendBtn = panel.querySelector('.va-input button');
    var opened = false;

    /* пузырь-зазывала: три предложения, потом умолкает; крестик — навсегда */
    var BUBBLES = [
      'Привет! Я ИИ-ассистент Венеры 👋 Спросите про цены, сроки или попросите расчёт вашего проекта — отвечаю мгновенно.',
      'Хотите расчёт сайта или ИИ-ассистента? Прикину стоимость и, если захотите, передам диалог Венере.',
      'Я работаю без VPN, выходных и перерывов. Проверьте: задайте любой вопрос, даже каверзный.'
    ];
    var bubbleIdx = 0, bubbleOff = false;
    function showBubble() {
      if (bubbleOff || panel.classList.contains('open')) return;
      bubble.querySelector('.t').textContent = BUBBLES[bubbleIdx % BUBBLES.length];
      bubbleIdx++;
      bubble.classList.add('show');
    }
    function hideBubble() { bubble.classList.remove('show'); }
    bubble.querySelector('.x').addEventListener('click', function (e) {
      e.stopPropagation(); bubbleOff = true; hideBubble();
    });
    bubble.addEventListener('click', function () {
      if (inline) { gotoInline(); return; }
      hideBubble();
      panel.classList.add('open');
      if (!opened) { opened = true; add('agent', GREETING); }
      input.focus();
    });
    setTimeout(showBubble, 6000);
    setInterval(function () { if (bubbleIdx < BUBBLES.length) showBubble(); }, 28000);

    function scroll() { bodyEl.scrollTop = bodyEl.scrollHeight; }
    function gotoInline() {
      hideBubble();
      host.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(function () { input.focus(); }, 600);
    }
    btn.addEventListener('click', function () {
      if (inline) { gotoInline(); return; }
      hideBubble();
      panel.classList.toggle('open');
      if (!opened && panel.classList.contains('open')) {
        opened = true;
        add('agent', GREETING);
      }
      if (panel.classList.contains('open')) input.focus();
    });
    if (inline) {
      add('agent', GREETING); /* витрина живая сразу */
    }

    function add(role, text) {
      var div = document.createElement('div');
      div.className = 'va-msg ' + role;
      div.textContent = text;
      bodyEl.appendChild(div);
      scroll();
    }

    var api = {
      user: function (t) { add('user', t); },
      agent: function (t) { add('agent', t); },
      typing: function (on) { typingEl.classList.toggle('show', !!on); scroll(); },
      _input: input, _sendBtn: sendBtn,
      lock: function (on) { sendBtn.disabled = !!on; }
    };
    sendBtn.addEventListener('click', function () { routeFromUI(api); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !sendBtn.disabled) routeFromUI(api); });
    return api;
  }

  /* ------------------------------------------------------------
     УДАЛЁННЫЙ ОТВЕТ: честное ожидание + один автоповтор + полезный пол
     ------------------------------------------------------------ */
  function usefulFloor(U, text) {
    U.agent('Нейросеть сейчас недоступна, но я не оставлю вас без ответа: лендинг от 30 000 ₽ (3-7 дней), боты и ИИ-ассистенты — от 30 000 ₽, связка лендинг + ассистент — от 55 000 ₽ (7-10 дней), консультация и расчёт бесплатны. Точную цену Венера назовёт лично после короткого брифа.');
    sendLog(text, '(полезный пол)', 'no-answer');
    if (ALERT_ON_NOANSWER) {
      sendAlert('Клиент не получил ответа нейросети: «' + text + '» (страница ' + (location.pathname || '') + '). Диалог в журнале.');
    }
    startLeadCapture(U);
  }

  function remoteAttempt(U, text, histSnap, retry) {
    U.typing(true);
    var warned = false;
    var warnTimer = setTimeout(function () {
      warned = true;
      U.agent(retry
        ? 'Проверяю ещё раз, это займёт полминуты. Спасибо, что ждёте.'
        : 'Нейросети нужно чуть больше времени — сложные вопросы она обдумывает до минуты. Подождём вместе? Если вам некогда — напишите «контакт», и я передам вопрос Венере лично.');
    }, retry ? 8000 : 12000);
    jsonp(PIPE_URL + '?action=chat&msg=' + encodeURIComponent(text) + '&hist=' + encodeURIComponent(JSON.stringify(histSnap)), retry ? 30000 : 45000, {
      ok: function (data) {
        clearTimeout(warnTimer);
        U.typing(false);
        if (data && data.ok && data.reply) {
          U.agent(data.reply);
          pushH('agent', data.reply);
          sendLog(text, data.reply, 'ai');
          state.lastExchange = 'Клиент: ' + text + ' | Бот: ' + data.reply;
          if (/передам|передать/.test(data.reply)) {
            state.dialog = state.lastExchange;
            state.await = 'esc_contact'; /* нейросеть пообещала передачу — ловим контакт */
          }
          if (!state.hookUsed && state.msgCount >= 3 && !state.await) {
            state.hookUsed = true;
            state.await = 'nudge';
            U.agent(NUDGE);
          }
        } else if (!retry) {
          remoteAttempt(U, text, histSnap, true); /* тихий автоповтор */
        } else {
          usefulFloor(U, text);
        }
      },
      fail: function () {
        clearTimeout(warnTimer);
        U.typing(false);
        if (!retry) { remoteAttempt(U, text, histSnap, true); } else { usefulFloor(U, text); }
      },
      timeout: function () {
        clearTimeout(warnTimer);
        U.typing(false);
        if (!retry) { remoteAttempt(U, text, histSnap, true); } else { usefulFloor(U, text); }
      }
    });
  }

  /* ------------------------------------------------------------
     ДВИЖОК ДИАЛОГА
     ------------------------------------------------------------ */
  var state = { await: null, contact: '', lastQ: '', hookUsed: false, msgCount: 0, lastExchange: '', dialog: '', hist: [] };

  function routeFromUI(U) {
    var text = (U._input.value || '').trim();
    if (!text) return;
    U._input.value = '';
    handle(U, text);
  }

  function handle(U, text) {
    U.user(text);
    var histSnap = state.hist.slice(0, 6);
    pushH('user', text);
    state.msgCount++;

    /* деликатный вопрос после ~3-го сообщения: да/нет */
    if (state.await === 'nudge') {
      var t = norm(text);
      state.await = null;
      if (/да|перед|хочу|давай|ок /.test(t)) {
        state.dialog = state.lastExchange;
        state.await = 'esc_contact';
        U.agent('Отлично. Напишите одним сообщением, как с вами связаться — @telegram, телефон или e-mail — и я передам диалог сразу.');
      } else if (/нет|не надо|отмен|позже/.test(t)) {
        U.agent('Понял, не передаю. Я всё равно рядом для любых вопросов.');
      } else {
        U.agent('Если согласны — напишите «передать» и оставьте контакт. Если нет — ничего страшного, я всё равно на связи.');
      }
      return;
    }

    /* прощание: тёплый финал, не считаем крючком */
    if (farewellMatch(text)) {
      state.await = null;
      U.agent(FAREWELL);
      sendLog(text, FAREWELL, 'bye');
      return;
    }

    /* режим эскалации: клиент оставил контакт для личного ответа Венеры */
    if (state.await === 'esc_contact') {
      if (norm(text).indexOf('отмена') !== -1) {
        state.await = null;
        U.agent('Понял, не передаю. Я всё равно рядом, если появятся вопросы.');
        return;
      }
      if (/^(да|дада|ок|окей|хорошо|актуально|передай|передайте|готов|согласен|согласна)\s*[!.]?$/i.test(norm(text).trim())) {
        U.agent('Тогда оставьте, пожалуйста, способ связи одной строкой: телефон, @ник в Telegram или e-mail — и я передам диалог сразу.');
        return;
      }
      if (norm(text).indexOf('контакт') !== -1 && /нужен|надо|оставить|мой/.test(norm(text))) {
        U.agent('Да, нужен 🙂 Напишите телефон, @ник или e-mail одной строкой — и весь диалог уйдёт Венере.');
        return;
      }
      if (looksLikeContact(text)) {
        var contact = text;
        state.await = null;
        U.typing(true);
        window.veneraSendLead(
          { name: contact.split(/\s+/)[0], contact: contact, message: '[диалог из чата, ждёт личного ответа Венеры] ' + state.dialog, source: 'chat-esc-' + location.hostname },
          function () { U.typing(false); U.agent('✅ Передал диалог Венере: она уже видит его в своём Telegram и ответит вам лично туда, куда вы оставили контакт. А я по-прежнему на связи для любых вопросов.'); },
          function () { U.typing(false); U.agent('Не получилось отправить автоматически. Напишите, пожалуйста, Венере напрямую: venera.web.4@gmail.com или Telegram — кнопка на сайте.'); }
        );
        return;
      }
      var kbNow = kbMatch(text);
      if (!kbNow) {
        U.agent('Похоже, это не контакт 🙂 Оставьте телефон (например, +7 9XX XXX-XX-XX), @ник в Telegram или e-mail — или напишите «отмена», и мы просто продолжим разговор.');
        return;
      }
      state.await = null; /* это новый вопрос — проваливаемся в обычную обработку */
    }

    /* режим сбора контакта для заявки */
    if (state.await === 'contact') {
      if (norm(text).indexOf('отмена') !== -1) {
        state.await = null;
        U.agent('Хорошо, отменил. Я рядом, если появятся вопросы.');
        return;
      }
      if (!looksLikeContact(text)) {
        var kbNow2 = kbMatch(text);
        if (!kbNow2) {
          U.agent('Похоже, это не контакт 🙂 Оставьте телефон (например, +7 9XX XXX-XX-XX), @ник в Telegram или e-mail — или напишите «отмена», и мы просто продолжим разговор.');
          return;
        }
        state.await = null; /* новый вопрос — проваливаемся в обычную обработку */
        /* переходим к ответу на вопрос, контакт не сохраняем */
      } else {
        state.contact = text;
        state.await = 'task';
        U.agent('Принял. Теперь коротко опишите задачу — или напишите «готово», если вопрос уже был выше.');
        return;
      }
    }
    if (state.await === 'task') {
      var task = (/готов|не надо|все|всё/).test(norm(text)) ? state.lastQ : text;
      state.await = null;
      U.typing(true);
      window.veneraSendLead(
        { name: state.contact.split(/\s+/)[0], contact: state.contact, message: '[из чата] ' + task, source: 'chat-' + location.hostname },
        function () { U.typing(false); U.agent('✅ Готово! Передал всё Венере: она увидит заявку в своей таблице и получит уведомление в Telegram. Свяжется с вами скоро.'); },
        function () { U.typing(false); U.agent('Не получилось отправить автоматически. Напишите, пожалуйста, Венере напрямую: почта venera.web.4@gmail.com или Telegram — кнопка на сайте.'); }
      );
      return;
    }

    /* 1) мгновенный ответ из локальной базы знаний */
    var intent = kbMatch(text);
    if (!intent) {
      var soc = socialMatch(text);
      if (soc && text.trim().length <= 40) intent = soc; /* вежливость — только для коротких реплик */
    }
    if (intent) {
      U.typing(true);
      setTimeout(function () {
        U.typing(false);
        U.agent(intent.a);
        pushH('agent', intent.a);
        sendLog(text, intent.a, intent.e ? 'esc-offer' : (intent.c ? 'kb-commercial' : 'kb'));
        state.lastExchange = 'Клиент: ' + text + ' | Бот: ' + intent.a;
        if (intent.e) {
          /* деликатная тема: сразу передаём диалог Венере, клиенту нужен контакт */
          state.dialog = 'Клиент: ' + text + ' | Бот: ' + intent.a;
          state.await = 'esc_contact';
          U.agent('Подскажите, как с вами связаться — @telegram, телефон или e-mail — и я передам весь диалог Венере прямо сейчас.');
          if (ALERT_ON_ESC) {
            sendAlert('Горячий вопрос: «' + text + '» (страница ' + (location.pathname || '') + '). Диалог в журнале, ждём контакт клиента.');
          }
        } else if (intent.c && !state.hookUsed) {
          state.hookUsed = true;
          U.agent(HOOK_TAIL);
          state.dialog = state.lastExchange;
          state.await = 'esc_contact'; /* хвостик теперь реально ловит контакт */
        }
        if (!state.hookUsed && state.msgCount >= 3 && !state.await) {
          state.hookUsed = true;
          state.await = 'nudge';
          U.agent(NUDGE);
        }
      }, 500 + Math.round(Math.random() * 500));
      return;
    }

    /* 2) сложный вопрос: нейросеть через PIPE, с честным ожиданием и автоповтором */
    state.lastQ = text;
    remoteAttempt(U, text, histSnap, false);
  }

  function startLeadCapture(U) {
    state.await = 'contact';
    U.agent('Зато я могу передать ваш вопрос Венере лично: она ответит по-человечески. Напишите одним сообщением, как к вам обращаться и как связаться (@telegram, телефон или e-mail). Отмена — слово «отмена».');
  }

  /* ------------------------------------------------------------
     ВНЕШНИЕ ФУНКЦИИ ДЛЯ РАЗМЕТКИ БОТ-САЙТА
     ------------------------------------------------------------ */
  window.sendChat = function () { if (ui) routeFromUI(ui); };

  window.sendLead = function (event) {
    event.preventDefault();
    var name = document.getElementById('leadName').value.trim();
    var contact = document.getElementById('leadContact').value.trim();
    var message = document.getElementById('leadMessage').value.trim();
    if (!name || !contact) return;
    var sendBtn = document.getElementById('leadSend');
    var success = document.getElementById('leadSuccess');
    sendBtn.disabled = true;
    success.classList.remove('show');
    window.veneraSendLead({ name: name, contact: contact, message: message, source: 'bot-form' },
      function () {
        success.textContent = '✅ Заявка принята! Венера скоро свяжется с вами.';
        success.classList.add('show');
        document.getElementById('leadForm').reset();
        sendBtn.disabled = false;
        setTimeout(function () { success.classList.remove('show'); }, 6000);
      },
      function () {
        success.textContent = 'Не удалось отправить автоматически. Напишите Венере в Telegram (ссылка в футере) или на venera.web.4@gmail.com.';
        success.classList.add('show');
        sendBtn.disabled = false;
        setTimeout(function () { success.classList.remove('show'); }, 8000);
      });
  };

  window.scrollToLead = function () {
    var lead = document.getElementById('lead');
    if (!lead) return;
    lead.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () {
      var f = document.getElementById('leadName');
      if (f) f.focus();
    }, 600);
  };

  /* ------------------------------------------------------------
     СТАРТ
     ------------------------------------------------------------ */
  window.veneraHandleTest = function (U, text) { handle(U, text); };
  window.veneraKBTest = {
    kb: function (t) { var m = kbMatch(t); return m ? m.a : null; },
    soc: function (t) { var m = socialMatch(t); return m ? m.a : null; },
    esc: function (t) { var m = kbMatch(t); return !!(m && m.e); }
  }; /* служебный крючок для самопроверки */
  function init() {
    jsonp(PIPE_URL + '?action=test', 10000, {}); /* тихий прогрев трубы, чтобы первый вопрос попал в прогретую */
    document.addEventListener('pointerdown', function () {
      jsonp(PIPE_URL + '?action=test', 10000, {}); /* догрев при первом клике: страница могла быть открыта давно */
    }, { once: true });
    if (document.getElementById('chatBody')) {
      ui = makeBotUI();
      ui.agent(GREETING);
      ui._sendBtn.addEventListener('click', function () { routeFromUI(ui); });
      ui._input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !ui._sendBtn.disabled) routeFromUI(ui);
      });
    } else {
      ui = makeWidgetUI();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
