/* movimento.js — movimento DESTE site (Kit de Design §9 + manual dentista 8.6; registro em specs/design.md §10).
   Só classes/atributos e transform/opacity; IntersectionObserver para entradas; window.aoRolar (main.js) para tudo que
   reage à rolagem, sem medir dentro do handler. main.js e base.css não se editam.
   Reproduz: entradas escalonadas das grades e do mosaico · assinatura 1 (luz no retrato, CSS; parallax ≤ 8% ≥ 900px) ·
   assinatura 2 (fio-guia dos passos) · cabeçalho tinta → osso depois do herói · acordeão com uma aberta por vez ·
   filtro do hub · ?heroi=1|2|3 no index (o gerente compara as 3 opções de imagem principal). */
(function () {
  'use strict';
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temIO = 'IntersectionObserver' in window;
  var todos = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  /* ?heroi=2|3: troca a imagem do herói da home pela opção pedida (mesmas variantes -480/-960/-1600). */
  var opcao = (location.search.match(/[?&]heroi=([123])/) || [])[1];
  if (opcao) {
    todos('[data-heroi] .heroi__midia source, [data-heroi] .heroi__midia img').forEach(function (el) {
      ['srcset', 'src'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && /heroi-opcao-[123]/.test(v) && v.indexOf('heroi-opcao-' + opcao) < 0) {
          v = v.replace(/heroi-opcao-[123]/g, 'heroi-opcao-' + opcao);
          if (opcao === '3' && a === 'srcset') v = v.replace(/heroi-opcao-3-480\.webp 480w(?=$)/, 'heroi-opcao-3-1600.webp 1600w');
          el.setAttribute(a, v);
        }
      });
    });
  }

  /* Cabeçalho: fundo tinta sobre o herói escuro, osso depois dele. Páginas sem herói escuro (404, política): osso direto. */
  var header = document.querySelector('[data-header]');
  var heroi = document.querySelector('[data-heroi]');
  if (header) {
    if (!heroi || !heroi.classList.contains('heroi')) header.setAttribute('data-claro', '');
    else {
      var limite = 0;
      var medir = function () { limite = heroi.offsetTop + heroi.offsetHeight - header.offsetHeight; };
      medir();
      window.addEventListener('resize', medir);
      window.aoRolar(function (d) { header.toggleAttribute('data-claro', d.scroll > limite); });
    }
  }

  /* Acordeão: uma pergunta aberta por vez (Kit: COPIAR). */
  todos('[data-acordeao]').forEach(function (ac) {
    var itens = todos('details', ac);
    itens.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        itens.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  });

  /* Filtro do hub: chips com aria-pressed; esconde por atributo (sem animação de altura). */
  todos('[data-filtro-grupo]').forEach(function (grupo) {
    var grade = grupo.parentNode.querySelector('.grade--filtravel');
    if (!grade) return;
    var chips = todos('.chip', grupo);
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filtro');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        todos('.card', grade).forEach(function (card) {
          var g = (card.getAttribute('data-grupos') || '').split('|');
          card.toggleAttribute('data-oculto', f !== 'todos' && g.indexOf(f) < 0);
        });
        grade.classList.toggle('grade--filtrada', f !== 'todos');
      });
    });
  });

  var grupos = todos('.revelar-grupo');
  var fotos = todos('.revelar-opacidade');
  var fios = todos('[data-fio]');
  grupos.forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 7)); }); });

  if (reduzir || !temIO) {             /* tudo pronto, sem movimento */
    grupos.concat(fotos).forEach(function (el) { el.classList.add('em-cena'); });
    fios.forEach(function (el) { el.classList.add('fio-ativo'); });
    return;
  }

  /* Entradas: grades de cards (filhos escalonados 60ms) e figuras do mosaico (opacity, 60ms) — uma vez. */
  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      if (el.classList.contains('revelar-opacidade')) {
        var irmaos = todos('.revelar-opacidade', el.parentNode);
        el.style.transitionDelay = Math.min(irmaos.indexOf(el), 5) * 60 + 'ms';
      }
      el.classList.add('em-cena');
      obs.unobserve(el);
    });
  }, { threshold: 0.15 });
  grupos.concat(fotos).forEach(function (el) { obs.observe(el); });

  /* Assinatura 2: o fio-guia se desenha entre os numerais (1,2 s em cascata) e cada número acende quando o fio chega. */
  var obsFio = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('fio-ativo');
      obsFio.unobserve(en.target);
    });
  }, { threshold: 0.35 });
  fios.forEach(function (el) { obsFio.observe(el); });

  /* Assinatura 1 (parte de rolagem): o retrato do herói desloca até 8% enquanto o herói sai da tela, só ≥ 900px. */
  var pc = window.matchMedia('(min-width: 900px)');
  var pic = document.querySelector('[data-parallax] > picture');
  if (pic && heroi) {
    var altura = 1;
    var medirH = function () { altura = Math.max(1, heroi.offsetTop + heroi.offsetHeight); };
    medirH();
    window.addEventListener('resize', medirH);
    window.aoRolar(function (d) {
      if (!pc.matches) { pic.style.transform = ''; return; }
      var p = Math.min(1, Math.max(0, d.scroll / altura));
      pic.style.transform = 'translateY(' + (-7.4 * p).toFixed(2) + '%)';
    });
  }
})();
