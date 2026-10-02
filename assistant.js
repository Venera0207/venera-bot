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
      a: 'Коротко о ценах: лендинг на чистом коде — от 15 000 ₽ (одна страница без интеграций); всё, что думает, считает и общается — калькуляторы, каталоги с админкой, чат-боты, ИИ-ассистенты — от 25 000 ₽; карточки Ozon/WB — от 2 000 ₽. Связка лендинг + ИИ-ассистент: 15 000 + 25 000 = от 40 000 ₽. Окончательная цена формируется из конкретного заказа и озвучивается Венерой лично.' },
    { k: ['связк', 'лендинг с ассистент', 'сайт с ассистент', 'лендинг плюс', 'всё вместе', 'под ключ'], c: 1,
      a: 'Связка лендинг + ИИ-ассистент складывается так: 15 000 ₽ лендинг + 25 000 ₽ ассистент = от 40 000 ₽. Ассистент при этом настраивается под ваши материалы и живёт прямо на странице. Окончательная цена формируется из конкретного заказа и озвучивается Венерой лично.' },
    { k: ['лендинг', 'одностранич', 'landing', 'лендос'], c: 1,
      a: 'Лендинг на чистом коде — от 15 000 ₽: одна страница, уникальный дизайн, быстрая загрузка, без конструкторов. Интеграции, калькуляторы и каталоги в эту цену не входят — это отдельные услуги.' },
    { k: ['бот', 'ассистент', 'агент', 'нейросет', 'ии-', 'ии ', 'ai', 'чат-бот', 'умный помощник'], c: 1,
      a: 'Венера создаёт ИИ-ассистентов и чат-ботов: они консультируют клиентов на сайте и в мессенджерах, собирают заявки и работают круглосуточно — от 25 000 ₽. Кстати, я и есть такой ассистент — можете тестировать меня сколько угодно.' },
    { k: ['каталог', 'корпоратив', 'витрин', 'интернет-магазин'], c: 1,
      a: 'Сайты и каталоги с админкой Венера делает вручную, на чистом коде: сайт принадлежит вам, без ежемесячной платы платформе. Проекты с каталогом, админкой или ИИ-ассистентом — от 25 000 ₽, точная цена после короткого брифа.' },
    { k: ['ozon', 'wb', 'wildberries', 'озон', 'валдберис', 'вайлдберриз', 'карточк товар'], c: 1,
      a: 'Карточки товаров для Ozon и Wildberries — от 2 000 ₽ за карточку: дизайн, который повышает конверсию.' },
    { k: ['редизайн', 'обновить сайт', 'передела', 'старый сайт'], c: 1,
      a: 'Редизайн — обновление визуальной системы и интерфейса без потери смысла и наработок. Цена — после просмотра текущего сайта, ориентировочно от 25 000 ₽.' },
    { k: ['на тильде сайт сделаете', 'сделаете на тильде', 'на тильде сделаете', 'на тильде возьметесь'], e: 1,
      a: 'Венера работает только с чистым кодом, без конструкторов, и цены начинаются от 15 000 ₽. Но я сейчас спрошу у неё лично про ваш вопрос.' },
    { k: ['сделаете за', 'за 5000', 'за пять тысяч', 'скидк', 'дешевл', 'подешев', 'торг', 'а подешевле'], e: 1,
      a: 'Цены Венеры начинаются от 15 000 ₽ за лендинг и от 25 000 ₽ за решения с ИИ — это честная цена без завышений. Но ваше пожелание я передам Венере лично прямо сейчас.' },
    { k: ['тильд', 'tilda', 'wix', 'викс', 'конструктор', 'таплик', 'на тильде', 'отлич', 'разниц', 'почему не', 'что лучше', 'плюсы', 'минусы'],
      a: 'Главные отличия сайта на чистом коде от конструктора (Tilda, Wix): 1) Скорость — нет тяжёлого слоя платформы, страницы открываются быстрее. 2) Собственность — сайт ваш навсегда, без ежемесячной платы платформе. 3) Уникальность — дизайн собирается под ваш бизнес, а не из шаблона, как у тысяч других. 4) Свобода — код можно перенести на любой хостинг и дорабатывать без ограничений платформы. 5) Любая функциональность — каталоги, калькуляторы, ИИ-ассистенты; конструктор упирается в свои готовые блоки. Поэтому Венера и работает без конструкторов.' },
    { k: ['срок', 'как быстро', 'когда будет готов', 'длительн', 'время выполн', 'как долго'], c: 1,
      a: 'Сроки: простой лендинг — около недели; проекты с каталогом, админкой или ИИ-ассистентом — от 2 до 4 недель. Точный срок Венера называет после короткого брифа.' },
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
    return String(s).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s]/gi, ' ');
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
      '.va-btn{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:50%;border:none;background:#0A0A12;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:9998}' +
      '.va-panel{position:fixed;right:22px;bottom:92px;width:340px;max-width:calc(100vw - 32px);height:460px;max-height:calc(100vh - 120px);background:#0A0A12;color:#eee;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.45);display:none;flex-direction:column;overflow:hidden;z-index:9999;font-family:inherit}' +
      '.va-panel.open{display:flex}' +
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
      '.va-input button{border:none;border-radius:10px;background:#7C5CFF;color:#fff;padding:10px 14px;cursor:pointer;font-weight:600}';
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.className = 'va-btn'; btn.setAttribute('aria-label', 'Чат с ИИ-ассистентом');
    btn.textContent = '💬';
    var panel = document.createElement('div');
    panel.className = 'va-panel';
    panel.innerHTML =
      '<div class="va-head"><div class="n">ИИ-ассистент Венеры</div><div class="s">на связи · отвечает без VPN</div></div>' +
      '<div class="va-body"></div>' +
      '<div class="va-typing">ассистент печатает…</div>' +
      '<div class="va-input"><input type="text" placeholder="Напишите сообщение…" autocomplete="off"><button>Отправить</button></div>';
    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var bodyEl = panel.querySelector('.va-body');
    var typingEl = panel.querySelector('.va-typing');
    var input = panel.querySelector('.va-input input');
    var sendBtn = panel.querySelector('.va-input button');
    var opened = false;

    function scroll() { bodyEl.scrollTop = bodyEl.scrollHeight; }
    btn.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (!opened && panel.classList.contains('open')) {
        opened = true;
        add('agent', GREETING);
      }
      if (panel.classList.contains('open')) input.focus();
    });

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
    U.agent('Нейросеть сейчас недоступна, но я не оставлю вас без ответа: лендинги Венеры начинаются от 15 000 ₽, боты и ИИ-ассистенты — от 25 000 ₽, сроки — от 5 дней, консультация и расчёт бесплатны. Точную цену Венера назовёт лично после короткого брифа.');
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

    /* режим сбора контакта для заявки */
    if (state.await === 'contact') {
      if (norm(text).indexOf('отмена') !== -1) {
        state.await = null;
        U.agent('Хорошо, отменил. Я рядом, если появятся вопросы.');
        return;
      }
      state.contact = text;
      state.await = 'task';
      U.agent('Принял. Теперь коротко опишите задачу — или напишите «готово», если вопрос уже был выше.');
      return;
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
    var intent = kbMatch(text) || socialMatch(text);
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
