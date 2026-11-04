/* МГИАГ 1.12 — КАРТА: закрытие визуальных трещин в земле.
   Через щели между плитками рельефа было видно фон (небо). Под рельефом кладётся грубая подложка
   того же материала и цвета, что и земля (следует за сезонами). Подложка лежит на 0,5 м ниже самой
   низкой точки каждой своей клетки, поэтому она ничего не перекрывает и не добавляет коллизий:
   игрок и машины взаимодействуют только с настоящим рельефом. */
(function () {
  'use strict';
  var done = false;
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof H === 'function' && typeof groundMat !== 'undefined' && typeof cityG !== 'undefined'; }
  function build() {
    if (done || !ready()) return; done = true;
    try {
      var S = 1180, N = 59, step = S / N, geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), z = pos.getZ(i), lo = Infinity;
        for (var dx = -1; dx <= 1; dx++) for (var dz = -1; dz <= 1; dz++) { var h = H(x + dx * step * .5, z + dz * step * .5); if (h < lo) lo = h; }
        pos.setY(i, Math.min(lo, H(x, z)) - .5);
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
      var m = new THREE.Mesh(geo, groundMat); m.userData.noShadow = true; m.userData.underlay = true; m.frustumCulled = false; m.renderOrder = -2;
      cityG.add(m); window.MG_UNDERLAY = m;
    } catch (e) { console.error('[MG_MAP underlay]', e); }
  }
  var iv = setInterval(function () { build(); if (done) clearInterval(iv); }, 400);
})();
