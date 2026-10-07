window['__id'] = "FxaZCqRimI94sl9";
window['__api'] = "http://localhost:48132";
(function () {
  function init() {
    var button = document.getElementById('copy');
    var spec = document.getElementById('spec');
    var timer;
    function label(text) {
      if (!button) return;
      button.textContent = text;
      clearTimeout(timer);
      timer = setTimeout(function () { button.textContent = 'Copy'; }, 2200);
    }
    function selectText() {
      if (!spec) return;
      var range = document.createRange();
      range.selectNodeContents(spec);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      label('Selected, press Ctrl+C');
    }
    if (button && spec) {
      button.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(spec.textContent).then(
            function () { label('Copied'); },
            selectText
          );
        } else {
          selectText();
        }
      });
    }
    var links = Array.prototype.slice.call(document.querySelectorAll('.side-link[href^="#"]'));
    var targets = links.map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    });
    function setActive(id) {
      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    }
    var sections = targets.filter(function (t) { return t; });
    // Ordena pela posição real no documento: a ordem dos links na sidebar
    // não precisa ser a mesma das seções (ex.: "yr-cli" fica dentro de
    // "Free to use"), e o destaque depende dessa ordem.
    sections.sort(function (a, b) {
      if (a === b) return 0;
      if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
    // A linha de referência fica logo abaixo do cabeçalho fixo. Usamos a
    // altura real do cabeçalho em vez do scroll-padding-top, que é um
    // calc() e vira NaN ao passar por parseFloat.
    function headerOffset() {
      var header = document.querySelector('.top');
      return (header ? header.offsetHeight : 54) + 24;
    }
    function updateActive() {
      if (!sections.length) return;
      // No fim da página a última seção pode nunca alcançar a linha de
      // referência; nesse caso destacamos direto a última.
      var atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(sections[sections.length - 1].id);
        return;
      }
      var line = headerOffset();
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= line) current = sections[i];
      }
      setActive(current.id);
    }
    // Exposto para os carregadores assíncronos (docs, cheat sheet) avisarem
    // quando a altura da página mudou.
    window.yrRefreshActive = updateActive;
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    window.addEventListener('hashchange', updateActive);
    window.addEventListener('load', updateActive);
    updateActive();
    initPanel();
  }
  function initPanel() {
    var panel = document.querySelector('.panel');
    if (!panel) return;
    var tab = panel.querySelector('.tab');
    var code = panel.querySelector('.code');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (tab) tab.textContent = 'hello.yr';
    var script = [
      { mk: '><' },
      { text: '_ .container' },
      { text: '_ h1' },
      { text: 'My page' },
      { blank: true },
      { mk: '##' },
      { text: '.container { max-width: 800px; margin: 0 auto; }' },
      { blank: true },
      { mk: '@@' },
      { text: "document.querySelector('h1').style.color = 'red';", hl: true },
      { blank: true },
      { mk: '&&' },
      { text: "app.get('/', (req, res) => res.render('index'));" },
      { text: "app.get('/health', (req, res) => res.send('ok'));", hl: true }
    ];
    function buildLine(row) {
      var el = document.createElement('div');
      el.className = 'l' + (row.hl ? ' hl' : '');
      if (row.blank) {
        el.textContent = '\u00A0';
      } else if (row.mk) {
        var mark = document.createElement('span');
        mark.className = 'mk';
        mark.textContent = row.mk;
        el.appendChild(mark);
      } else {
        el.textContent = row.text;
      }
      return el;
    }
    var lines = [];
    if (code) {
      script.forEach(function (row) {
        var el = buildLine(row);
        code.appendChild(el);
        lines.push(el);
      });
    }
    if (reduce) {
      panel.classList.add('is-static');
      return;
    }
    setTimeout(function () {
      panel.classList.add('is-sent');
      setTimeout(function () {
        panel.classList.add('is-received');
        lines.forEach(function (el, i) {
          setTimeout(function () { el.classList.add('is-on'); }, i * 90);
        });
      }, 600);
    }, 300);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
// ---------- Menu do mobile: abre e fecha a barra lateral ----------
(function () {
  var toggle = document.getElementById("menu-toggle");
  var sidebar = document.getElementById("sidebar");
  var scrim = document.querySelector(".scrim");
  if (!toggle || !sidebar) return;
  function setMenu(open) {
    sidebar.classList.toggle("is-open", open);
    if (scrim) scrim.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () {
    setMenu(!sidebar.classList.contains("is-open"));
  });
  if (scrim) scrim.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });
  // Fecha ao escolher um link: o alvo pode ficar escondido atrás do drawer.
  sidebar.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("a")) setMenu(false);
  });
  // Em telas largas a barra fica sempre visível; garante estado limpo.
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1024) setMenu(false);
  });
})();
// ---------- Docs: renderiza arquivos .md do repositório de docs ----------
(function () {
  var BASE = "https://raw.githubusercontent.com/yr-lang/docs/refs/heads/main/";
  var DOCS = [
    { id: "readme", file: "README.md", section: "overview" },
    { id: "api-doc", file: "api.md", section: "api" },
    { id: "syntax-doc", file: "syntax.md", section: "syntax" },
    { id: "examples-doc", file: "examples.md", section: "examples" }
  ];
  function slug(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
  function renderMarkdown(host, md) {
    if (window.marked) {
      var html = typeof window.marked.parse === "function"
        ? window.marked.parse(md)
        : window.marked(md);
      host.innerHTML = html;
      return;
    }
    // Fallback: sem parser, mostra o markdown cru em vez de quebrar.
    var pre = document.createElement("pre");
    pre.textContent = md;
    host.replaceChildren(pre);
  }
  // Cada "##" do markdown vira uma subsubseção: o heading ganha um id e
  // um link aninhado na barra lateral, logo abaixo da subseção.
  function buildSubSections(host, section) {
    var headings = host.querySelectorAll("h2");
    var link = document.querySelector('.side-link[href="#' + section + '"]');
    if (!headings.length || !link) return;
    var nav = document.createElement("div");
    nav.className = "side-sub";
    Array.prototype.forEach.call(headings, function (heading) {
      var id = section + "--" + (slug(heading.textContent) || "section");
      heading.id = id;
      var item = document.createElement("a");
      item.className = "side-sub-link";
      item.href = "#" + id;
      item.textContent = heading.textContent;
      nav.appendChild(item);
    });
    link.insertAdjacentElement("afterend", nav);
  }
  function loadDoc(doc) {
    var host = document.getElementById(doc.id);
    if (!host) return Promise.resolve();
    return fetch(BASE + doc.file)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (md) {
        renderMarkdown(host, md);
        buildSubSections(host, doc.section);
        host.setAttribute("aria-busy", "false");
      })
      .catch(function (err) {
        var p = document.createElement("p");
        p.className = "readme__status";
        p.textContent = "Could not load the documentation. " + err.message;
        host.replaceChildren(p);
        host.setAttribute("aria-busy", "false");
      });
  }
  Promise.all(DOCS.map(loadDoc)).then(function () {
    // Com os docs carregados a página muda de altura: reposiciona quem
    // entrou por um link âncora e reavalia a seção ativa.
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
    if (typeof window.yrRefreshActive === "function") window.yrRefreshActive();
  });
})();
// ---------- Cheat sheet: carrega o llm.txt no bloco de specs ----------
(function () {
  var SPEC_URL = "https://raw.githubusercontent.com/yr-lang/docs/refs/heads/main/llm.txt";
  var spec = document.getElementById("spec");
  if (!spec) return;
  fetch(SPEC_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (text) {
      spec.textContent = text;
      if (typeof window.yrRefreshActive === "function") window.yrRefreshActive();
    })
    .catch(function (err) {
      spec.textContent = "Could not load the cheat sheet. " + err.message;
    });
})();
// ---------- Preview interativo: editor yr -> yr(value) -> iframe ----------
function yrInitPreview() {
  const yrEditor = document.getElementById("yr-editor");
  const yrFrame = document.getElementById("yr-preview-frame");
  const yrMirror = document.getElementById("yr-mirror");
  const yrGutter = document.getElementById("yr-gutter");
  // Exemplo inicial: HTML + CSS + uma seção JS (@@) que faz a mãozinha acenar
  const YR_SAMPLE = [
    "><",
    "_ .card",
    "  _h1 .title",
    "    _span .wave",
    "      👋",
    "    Olá, yr!",
    "  _p .hint",
    "    Edite este código e veja o resultado ao vivo.",
    "",
    "##",
    "body {",
    "  margin: 0;",
    "  font-family: system-ui, sans-serif;",
    "  background: #0d1117;",
    "  color: #e6edf3;",
    "}",
    ".card {",
    "  max-width: 420px;",
    "  margin: 48px auto;",
    "  padding: 32px;",
    "  text-align: center;",
    "  background: #161b22;",
    "  border: 1px solid #30363d;",
    "  border-radius: 14px;",
    "}",
    ".title { margin: 0 0 8px; font-size: 1.6rem; }",
    ".wave {",
    "  display: inline-block;",
    "  font-size: 2rem;",
    "  transform-origin: 70% 80%;",
    "}",
    ".hint { margin: 0; color: #8b949e; }",
    "",
    "@@",
    "const wave = document.querySelector('.wave');",
    "let up = false;",
    "setInterval(() => {",
    "  wave.style.transform = up ? 'rotate(18deg)' : 'rotate(-12deg)';",
    "  up = !up;",
    "}, 350);"
  ].join("\n");
  // Desenha os números de linha e o cursor piscando na posição do caret
  function renderEditor() {
    if (!yrEditor) return;
    const value = yrEditor.value;
    if (yrGutter) {
      const total = value.split("\n").length;
      let out = "";
      for (let i = 1; i <= total; i++) out += i + (i < total ? "\n" : "");
      yrGutter.textContent = out;
    }
    if (yrMirror) {
      const pos = yrEditor.selectionStart;
      const caret = document.createElement("span");
      caret.className = "yrkit-preview__caret";
      yrMirror.replaceChildren(
        document.createTextNode(value.slice(0, pos)),
        caret,
        document.createTextNode(value.slice(pos))
      );
    }
  }
  // Mantém goteira e espelho alinhados ao scroll do textarea
  function syncEditorScroll() {
    if (!yrEditor) return;
    if (yrMirror) {
      yrMirror.scrollTop = yrEditor.scrollTop;
      yrMirror.scrollLeft = yrEditor.scrollLeft;
    }
    if (yrGutter) {
      yrGutter.scrollTop = yrEditor.scrollTop;
    }
  }
  function renderPreview(source) {
    if (!yrFrame) return;
    try {
      const result = yr(source);
      yrFrame.srcdoc = (result && result.parsedhtml) || "";
    } catch (err) {
      yrFrame.srcdoc =
        '<pre style="margin:0;padding:14px;font-family:monospace;font-size:13px;'
        + 'color:#b91c1c;white-space:pre-wrap">'
        + String(err && err.message ? err.message : err) + "</pre>";
    }
  }
  if (yrEditor) {
    // Vira true assim que o usuário toca no editor: a partir daí não
    // puxamos mais o caret para o fim, pra não atrapalhar a digitação.
    let editorTouched = false;
    const markTouched = () => { editorTouched = true; };
    yrEditor.addEventListener("pointerdown", markTouched, { once: true });
    yrEditor.addEventListener("keydown", markTouched, { once: true });
    const refreshEditor = () => {
      renderEditor();
      syncEditorScroll();
    };
    // Deixa o caret no fim e rola até lá, pro cursor ficar visível
    // (sincroniza goteira e espelho junto).
    const scrollEditorToEnd = () => {
      if (editorTouched) return;
      const end = yrEditor.value.length;
      yrEditor.setSelectionRange(end, end);
      renderEditor();
      // Ler scrollHeight força o recálculo do layout; sem isso a
      // atribuição de scrollTop pode ser ignorada ou "curta demais".
      void yrEditor.scrollHeight;
      yrEditor.scrollTop = yrEditor.scrollHeight;
      syncEditorScroll();
    };
    // rAF duplo garante que roda depois do primeiro layout/paint.
    const scheduleScrollToEnd = () => {
      requestAnimationFrame(() => requestAnimationFrame(scrollEditorToEnd));
    };
    // Atualiza o valor do editor e reagenda o scroll até o fim.
    const setEditorValue = (text) => {
      yrEditor.value = text;
      refreshEditor();
      renderPreview(text);
      scheduleScrollToEnd();
    };
    yrEditor.addEventListener("change", () => {
      refreshEditor();
      renderPreview(yrEditor.value);
    });
    ["click", "keyup", "focus", "select"].forEach(ev =>
      yrEditor.addEventListener(ev, refreshEditor)
    );
    yrEditor.addEventListener("scroll", syncEditorScroll);
    // Move o cursor piscando quando a seleção muda (arrasto, setas, etc.)
    document.addEventListener("selectionchange", () => {
      if (document.activeElement === yrEditor) refreshEditor();
    });
    // Valor inicial + rolagem até o fim.
    setEditorValue(YR_SAMPLE);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", yrInitPreview);
} else {
  yrInitPreview();
}
