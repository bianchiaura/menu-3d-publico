/* Menú 3D · biblioteca de modelos 3D hechos con código.
   En el menu.json, cada plato elige su modelo por nombre: "modelo": "flan".
   Para sumar un modelo nuevo: escribir su función y agregarla a BIBLIOTECA (al final). */
window.Menu3DModelos = function (THREE) {
  'use strict';

  /* ---------- helpers de modelado ---------- */
  var TOP = .07;
  var seed = 42;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function mat(c, r, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r == null ? .7 : r, metalness: 0 }, o || {})); }
  function mesh(g, m, x, y, z) { var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o; }
  function ell(rx, ry, rz, m, x, y, z) { var o = mesh(new THREE.SphereGeometry(1, 20, 14), m, x, y, z); o.scale.set(rx, ry, rz); return o; }
  function cyl(rt, rb, h, m, x, y, z, seg) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 40), m, x, y, z); }

  function plate(sc, c) {
    var pts = [[0, 0], [.55, 0], [.62, .03], [.95, .1], [1, .115], [.97, .125], [.9, .1], [.62, .05], [0, .05]]
      .map(function (a) { return new THREE.Vector2(a[0], a[1]); });
    var m = mesh(new THREE.LatheGeometry(pts, 64), mat(c || 0xf7f4ee, .35, { side: THREE.DoubleSide }));
    m.scale.setScalar(sc || 1);
    return m;
  }

  function steak(w, d, h, col) {
    var g = new THREE.SphereGeometry(1, 56, 28), pos = g.attributes.position, cols = [];
    var base = new THREE.Color(col), sear = new THREE.Color(0x4e2412), dark = new THREE.Color(0x1d0d06);
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var c = base.clone().lerp(sear, Math.max(0, y) * .85);
      if (y > .35 && Math.sin((x + z * .45) * 15) > .72) c = dark;
      cols.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    var m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55 }));
    m.scale.set(w, h, d);
    return m;
  }

  function fries(g, cx, cz, n) {
    var m = mat(0xe8b94a, .6);
    for (var i = 0; i < n; i++) {
      var b = mesh(new THREE.BoxGeometry(.07, .07, .5), m, cx + (rnd() - .5) * .4, TOP + .05 + rnd() * .12, cz + (rnd() - .5) * .35);
      b.rotation.set((rnd() - .5) * .5, rnd() * 3.14, (rnd() - .5) * .4);
      g.add(b);
    }
  }
  function leaf(g, x, y, z, s, col) {
    var l = ell(s, s * .18, s * .55, mat(col || 0x3f8a3a, .7), x, y, z);
    l.rotation.y = rnd() * 6.28; l.rotation.z = (rnd() - .5) * .5; g.add(l);
  }

  /* ---------- platos ---------- */
  function dishSteak(kind) {
    var g = new THREE.Group(); g.add(plate());
    if (kind === 1) {
      var s = steak(.62, .52, .1, 0xa5502e); s.position.set(-.15, TOP + .09, 0); s.rotation.y = .3; g.add(s);
      for (var i = 0; i < 9; i++) g.add(ell(.05, .03, .05, mat(0x3f8a3a, .8), -.15 + (rnd() - .5) * .6, TOP + .2, (rnd() - .5) * .4));
      g.add(cyl(.08, .08, .02, mat(0xe9d6a0, .8), .55, TOP + .01, -.55));
      fries(g, .5, .25, 22);
    } else if (kind === 2) {
      var s2 = steak(.5, .48, .13, 0x9a4a2c); s2.position.set(-.1, TOP + .12, 0); g.add(s2);
      g.add(cyl(.13, .13, .04, mat(0xe8dc8a, .5), -.1, TOP + .25, 0));
      for (var j = 0; j < 3; j++) { var r = cyl(.012, .012, .35, mat(0x3f6a2c, .8), .3 + j * .05, TOP + .22, -.2 + j * .05); r.rotation.z = 1.3; r.rotation.y = j; g.add(r); }
      fries(g, .55, .3, 18);
    } else {
      var s3 = steak(.85, .3, .08, 0x9c4a2a); s3.position.set(-.05, TOP + .07, -.1); s3.rotation.y = -.2; g.add(s3);
      var cc = [0xd63a2a, 0x3f8a3a, 0xf0e2b0];
      for (var k = 0; k < 18; k++) { var cb = mesh(new THREE.BoxGeometry(.07, .06, .07), mat(cc[k % 3], .6), .1 + rnd() * .5, TOP + .04, .3 + rnd() * .3); cb.rotation.y = rnd() * 3; g.add(cb); }
      fries(g, -.4, .5, 12);
    }
    return g;
  }

  function dishPasta(veg) {
    var g = new THREE.Group(); g.add(plate());
    g.add(cyl(.74, .74, .03, mat(veg ? 0xd9442f : 0xc23a24, .45), 0, TOP + .015, 0, 48));
    var n = veg ? 4 : 5, dough = mat(veg ? 0xf3e2b3 : 0xefd79c, .6);
    for (var i = 0; i < n; i++) {
      var a = i / n * 6.28 + .3, p = ell(veg ? .26 : .21, veg ? .13 : .08, veg ? .26 : .21, dough, Math.cos(a) * .36, TOP + .1, Math.sin(a) * .36);
      p.rotation.y = a; g.add(p);
    }
    for (var k = 0; k < 26; k++) g.add(mesh(new THREE.BoxGeometry(.03, .015, .03), mat(veg ? 0x8a5a2a : 0xf7f3e6, .8), (rnd() - .5) * .8, TOP + .22, (rnd() - .5) * .8));
    for (var q = 0; q < 4; q++) leaf(g, Math.cos(q * 1.6) * .12, TOP + .22, Math.sin(q * 1.6) * .12, .09, 0x2f7a30);
    return g;
  }

  function bun(top) {
    var g = new THREE.Group(), c = 0xe5ab5c;
    if (top) {
      var d = mesh(new THREE.SphereGeometry(.52, 40, 20, 0, 6.2832, 0, 1.5708), mat(c, .5, { side: THREE.DoubleSide }));
      d.scale.y = .8; g.add(d);
      for (var i = 0; i < 34; i++) {
        var th = rnd() * 1.1, ph = rnd() * 6.28, s = ell(.025, .012, .012, mat(0xf6e8c8, .6), .5 * Math.sin(th) * Math.cos(ph), .52 * .8 * Math.cos(th) + .01, .5 * Math.sin(th) * Math.sin(ph));
        s.rotation.y = ph; g.add(s);
      }
    } else g.add(cyl(.52, .48, .16, mat(c, .55), 0, .08, 0));
    return g;
  }

  function dishBurger(veg) {
    var g = new THREE.Group(); g.add(plate(1.05)); var y = TOP, b = bun(false); b.position.y = y; g.add(b); y += .16;
    function layer(m, h, r) { var c = cyl(r || .5, r || .5, h, m, 0, y + h / 2, 0); g.add(c); y += h; return c; }
    function lettuce(col) {
      for (var i = 0; i < 2; i++) { var t = mesh(new THREE.TorusGeometry(.46, .05, 8, 36), mat(col, .7), 0, y + .04 + i * .02, 0); t.rotation.x = Math.PI / 2; t.scale.set(1, 1, .6); g.add(t); }
      g.add(cyl(.46, .46, .02, mat(col, .7), 0, y + .02, 0)); y += .08;
    }
    function cheese() { var c = mesh(new THREE.BoxGeometry(.95, .02, .95), mat(0xf2b22b, .4), 0, y + .01, 0); c.rotation.y = .78; g.add(c); y += .03; }
    function tomato() { for (var i = 0; i < 2; i++) g.add(cyl(.27, .27, .04, mat(0xd2352a, .4), (i - .5) * .4, y + .02, (i - .5) * .1)); y += .05; }
    if (!veg) {
      lettuce(0x4e9a3a); tomato();
      layer(mat(0x55291a, .8), .13, .49); cheese();
      layer(mat(0x55291a, .8), .13, .49); cheese();
      for (var k = 0; k < 3; k++) { var bc = mesh(new THREE.BoxGeometry(.8, .015, .09), mat(0x8a2a1a, .6), 0, y + .01 + k * .004, -.2 + k * .2); bc.rotation.y = (k - 1) * .2; g.add(bc); }
      y += .03;
      for (var p = 0; p < 4; p++) g.add(cyl(.07, .07, .015, mat(0x8aa83a, .5), Math.cos(p * 1.7) * .28, y + .01, Math.sin(p * 1.7) * .28));
      y += .02; fries(g, .6, .55, 10);
    } else {
      for (var i = 0; i < 12; i++) leaf(g, (rnd() - .5) * .7, y + .04, (rnd() - .5) * .7, .15, 0x2e7a2c); y += .07;
      tomato();
      var pt = layer(mat(0x6b3345, .85), .14, .48);
      for (var j = 0; j < 4; j++) { var av = ell(.38, .02, .11, mat(0xb6d27a, .5), 0, y + .02 + j * .01, (j - 1.5) * .17); g.add(av); } y += .06;
    }
    var t = bun(true); t.position.y = y; g.add(t);
    return g;
  }

  function dishCapp() {
    var g = new THREE.Group(); g.add(plate(.85, 0xfaf7f1));
    var pr = [[0, 0], [.22, 0], [.3, .06], [.38, .3], [.43, .5], [.45, .52], [.43, .52], [.41, .5], [.36, .28], [.28, .1], [0, .08]]
      .map(function (a) { return new THREE.Vector2(a[0], a[1]); });
    var cup = mesh(new THREE.LatheGeometry(pr, 56), mat(0xffffff, .25, { side: THREE.DoubleSide }), 0, TOP, 0); cup.scale.setScalar(1.15); g.add(cup);
    g.add(cyl(.42, .42, .02, mat(0x6b3f23, .4), 0, TOP + .5, 0));
    g.add(cyl(.36, .36, .02, mat(0xf2e4cb, .9), 0, TOP + .515, 0));
    [[.06, .13], [.15, .21], [.24, .3]].forEach(function (r) {
      var rg = mesh(new THREE.RingGeometry(r[0], r[1], 40, 1, .5, 5.2), mat(0xc9a77a, .9, { side: THREE.DoubleSide }), 0, TOP + .527, 0); rg.rotation.x = -Math.PI / 2; g.add(rg);
    });
    var h = mesh(new THREE.TorusGeometry(.17, .045, 12, 24, Math.PI * 1.2), mat(0xffffff, .25), .55, TOP + .3, 0); h.rotation.z = -Math.PI * .6; g.add(h);
    return g;
  }

  function dishMedialunas() {
    var g = new THREE.Group(); g.add(plate(1.05));
    var gold = new THREE.MeshPhysicalMaterial({ color: 0xd9953a, roughness: .35, clearcoat: .6, clearcoatRoughness: .3 });
    [[0, -.35, .2], [-.5, .35, 1.9], [.5, .3, -1.9]].forEach(function (c) {
      var cr = new THREE.Group(), A = Math.PI * .55;
      for (var i = 0; i <= 12; i++) {
        var a = -A + 2 * A * i / 12, rr = .045 + .1 * Math.cos(a / A * Math.PI / 2);
        var s = ell(rr, rr, rr * 1.15, gold, .34 * Math.sin(a), rr * .9, .34 * Math.cos(a) - .34); s.rotation.y = a; cr.add(s);
      }
      cr.position.set(c[0], TOP, c[1]); cr.rotation.y = c[2]; g.add(cr);
    });
    return g;
  }

  function glassMat() { return new THREE.MeshPhysicalMaterial({ color: 0xe3f4f6, roughness: .05, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }); }

  function dishLemonade() {
    var g = new THREE.Group(); g.add(plate(.75, 0xefe8da)); var y = TOP;
    g.add(cyl(.38, .3, 1.2, glassMat(), 0, y + .6, 0));
    var liq = cyl(.36, .29, 1.0, mat(0xf4e56b, .2, { transparent: true, opacity: .85 }), 0, y + .55, 0); g.add(liq);
    for (var i = 0; i < 5; i++) { var ic = mesh(new THREE.BoxGeometry(.2, .2, .2), mat(0xffffff, .1, { transparent: true, opacity: .55 }), (rnd() - .5) * .3, y + .7 + rnd() * .2, (rnd() - .5) * .3); ic.rotation.set(rnd(), rnd(), rnd()); g.add(ic); }
    for (var m = 0; m < 6; m++) leaf(g, (rnd() - .5) * .4, y + 1.07, (rnd() - .5) * .4, .12, 0x2f8a3a);
    var ls = mesh(new THREE.TorusGeometry(.2, .03, 10, 30), mat(0xf1c40f, .5), .38, y + 1.12, 0); ls.rotation.y = Math.PI / 2; g.add(ls);
    var ld = cyl(.19, .19, .02, mat(0xf8ec9a, .6), .38, y + 1.12, 0); ld.rotation.z = Math.PI / 2; g.add(ld);
    var sw = cyl(.025, .025, 1.45, mat(0x2fa05a, .5), .1, y + .78, .05); sw.rotation.z = -.18; g.add(sw);
    return g;
  }

  function dishBeer() {
    var g = new THREE.Group(); g.add(plate(.75, 0xefe8da)); var y = TOP;
    g.add(cyl(.43, .31, 1.15, glassMat(), 0, y + .58, 0));
    g.add(cyl(.41, .3, .85, mat(0xd88a1b, .15, { transparent: true, opacity: .92 }), 0, y + .45, 0));
    g.add(cyl(.42, .41, .2, mat(0xfaf4e4, .9), 0, y + 1.0, 0));
    for (var i = 0; i < 7; i++) g.add(ell(.1, .06, .1, mat(0xfaf4e4, .9), (rnd() - .5) * .5, y + 1.1, (rnd() - .5) * .5));
    return g;
  }

  function dishFlan() {
    var g = new THREE.Group(); g.add(plate());
    g.add(cyl(.78, .78, .02, mat(0xb35a14, .25, { transparent: true, opacity: .9 }), 0, TOP + .01, 0, 56));
    g.add(cyl(.42, .55, .5, mat(0xf2c25e, .55), 0, TOP + .25, 0, 56));
    g.add(cyl(.44, .44, .03, mat(0x93440e, .2), 0, TOP + .515, 0, 56));
    for (var i = 0; i < 10; i++) { var a = i / 10 * 6.28, d = ell(.05, .1 + rnd() * .08, .04, mat(0x93440e, .2), Math.cos(a) * .45, TOP + .43, Math.sin(a) * .45); d.rotation.y = -a; g.add(d); }
    var dl = new THREE.MeshPhysicalMaterial({ color: 0x8a4a1c, roughness: .3, clearcoat: .5 });
    g.add(ell(.16, .09, .16, dl, 0, TOP + .58, 0));
    for (var k = 0; k < 4; k++) g.add(ell(.11, .08, .11, mat(0xffffff, .9), Math.cos(k * 1.6 + .5) * .25, TOP + .56, Math.sin(k * 1.6 + .5) * .25));
    return g;
  }

  function dishBrownie() {
    var g = new THREE.Group(); g.add(plate());
    g.add(cyl(.8, .8, .02, new THREE.MeshPhysicalMaterial({ color: 0x1f0e07, roughness: .2, clearcoat: .8 }), 0, TOP + .01, 0, 56));
    var br = mesh(new THREE.BoxGeometry(.85, .34, .85), mat(0x3b2012, .85), 0, TOP + .17, 0); br.rotation.y = .3; g.add(br);
    var tl = mesh(new THREE.BoxGeometry(.8, .03, .8), mat(0x4e2c17, .9), 0, TOP + .35, 0); tl.rotation.y = .3; g.add(tl);
    for (var i = 0; i < 7; i++) { var n = mesh(new THREE.BoxGeometry(.1, .05, .08), mat(0xc59a62, .8), (rnd() - .5) * .6, TOP + .38, (rnd() - .5) * .6); n.rotation.y = rnd() * 3; g.add(n); }
    g.add(ell(.3, .28, .3, mat(0xf6e8c8, .7), 0, TOP + .62, 0));
    var dk = new THREE.MeshPhysicalMaterial({ color: 0x2a140a, roughness: .25, clearcoat: .7 });
    [[.2, .74], [.27, .62], [.24, .5]].forEach(function (r) { var t = mesh(new THREE.TorusGeometry(r[0], .02, 8, 28), dk, 0, TOP + r[1] - .02, 0); t.rotation.x = Math.PI / 2; g.add(t); });
    return g;
  }

  /* ---------- biblioteca: nombre que se usa en el menu.json → modelo ---------- */
  var BIBLIOTECA = {
    'bife-de-chorizo': function () { return dishSteak(1); },
    'ojo-de-bife': function () { return dishSteak(2); },
    'entrana': function () { return dishSteak(3); },
    'ravioles': function () { return dishPasta(false); },
    'sorrentinos': function () { return dishPasta(true); },
    'hamburguesa': function () { return dishBurger(false); },
    'hamburguesa-veggie': function () { return dishBurger(true); },
    'cappuccino': dishCapp,
    'medialunas': dishMedialunas,
    'limonada': dishLemonade,
    'cerveza': dishBeer,
    'flan': dishFlan,
    'brownie': dishBrownie
  };

  return {
    nombres: Object.keys(BIBLIOTECA),
    /* devuelve el modelo listo, o null si el nombre no está en la biblioteca */
    crear: function (nombre) {
      var f = BIBLIOTECA[nombre]; if (!f) return null;
      seed = 42;
      return f();
    }
  };
};
/* los mismos nombres de BIBLIOTECA, para los paneles (que no cargan three.js). Si sumás un modelo, agregalo también acá */
window.Menu3DModelos.nombres = ['bife-de-chorizo', 'ojo-de-bife', 'entrana', 'ravioles', 'sorrentinos', 'hamburguesa', 'hamburguesa-veggie', 'cappuccino', 'medialunas', 'limonada', 'cerveza', 'flan', 'brownie'];
