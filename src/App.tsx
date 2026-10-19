import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    const $ = (s: string) => document.querySelector(s) as HTMLElement | null;
    const $$ = (s: string) => [...document.querySelectorAll(s)] as HTMLElement[];
    const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
    const pad = (n: number) => String(n).padStart(2, '0');
    const sm = (a: number, b: number, x: number) => {
      x = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return x * x * (3 - 2 * x);
    };

    /* ─── Lenis smooth scroll ─── */
    let lenis: Lenis | null = null;
    if (!RM) {
      lenis = new Lenis({ lerp: 0.085 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis?.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.stop();
    }

    const onAnchorClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      const t = document.querySelector(href) as HTMLElement | null;
      if (!t) return;
      if (lenis) lenis.scrollTo(t);
      else t.scrollIntoView({ behavior: 'smooth' });
    };
    document.addEventListener('click', onAnchorClick);

    /* ─── Split helper ─── */
    const split = (el: HTMLElement, w: boolean | number, mask: boolean | number) => {
      const t = el.textContent?.trim() || '';
      el.setAttribute('aria-label', t);
      el.textContent = '';
      const parts = w ? t.split(' ') : [...t];
      return parts.map((s, i, a) => {
        const c = document.createElement('span');
        c.className = 'c';
        c.setAttribute('aria-hidden', 'true');
        c.textContent = s;
        let n: HTMLElement = c;
        if (mask) {
          n = document.createElement('span');
          n.className = 'm';
          n.setAttribute('aria-hidden', 'true');
          n.appendChild(c);
        }
        el.appendChild(n);
        if (w && i < a.length - 1) el.append(' ');
        return c;
      });
    };

    /* ─── Pointer, cursor, magnetic ─── */
    const M = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
    const cur = $('.cur');
    const dot = $('.dot');
    const ring = $('.ring');
    let rx = M.x, ry = M.y, vx = 0, vy = 0;

    const onPointerMove = (e: PointerEvent) => {
      M.x = e.clientX;
      M.y = e.clientY;
      M.nx = (e.clientX / innerWidth) * 2 - 1;
      M.ny = 1 - (e.clientY / innerHeight) * 2;
    };
    const onPointerOver = (e: PointerEvent) => {
      if (cur) cur.classList.toggle('h', !!(e.target as HTMLElement).closest('a,[data-cur]'));
    };
    addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerover', onPointerOver);

    /* ─── WebGL point cloud ─── */
    let GL: { rs: () => void; draw: (t: number, mix: number, f: number) => void } | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let geo: THREE.BufferGeometry | null = null;
    let mat: THREE.ShaderMaterial | null = null;

    try {
      const cv = $('#gl') as HTMLCanvasElement;
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, powerPreference: 'high-performance' });
      const dpr = Math.min(devicePixelRatio, 1.75);
      renderer.setPixelRatio(dpr);

      const sc = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      const N = innerWidth < 700 ? 6000 : 15000;
      const A = new Float32Array(N * 3);
      const B = new Float32Array(N * 3);
      const K = new Float32Array(N);
      const Z = new Float32Array(N);
      const ga = Math.PI * (3 - Math.sqrt(5));
      const core = Math.floor(N * 0.95);

      for (let i = 0; i < N; i++) {
        let x: number, y: number, z: number, kind = 0;
        if (i < core) {
          const yy = 1 - 2 * (i + 0.5) / core;
          const s = Math.sqrt(1 - yy * yy);
          const th = i * ga;
          const R = 2.1 * (0.98 + Math.random() * 0.03);
          x = R * s * Math.cos(th);
          y = R * yy;
          z = R * s * Math.sin(th);
        } else {
          const R = 2.7 + Math.random() * 0.9;
          const uu = Math.random() * 2 - 1;
          const t = Math.random() * 6.2832;
          const s = Math.sqrt(1 - uu * uu);
          x = R * s * Math.cos(t);
          y = R * uu * 0.7;
          z = R * s * Math.sin(t);
          kind = 1;
        }
        A.set([x, y, z], i * 3);
        B.set([(Math.random() - 0.5) * 15, 0, (Math.random() - 0.5) * 11 - 1], i * 3);
        K[i] = Math.random() < 0.004 ? 1 : 0;
        Z[i] = kind;
      }

      geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(A, 3));
      geo.setAttribute('aB', new THREE.BufferAttribute(B, 3));
      geo.setAttribute('aK', new THREE.BufferAttribute(K, 1));
      geo.setAttribute('aT', new THREE.BufferAttribute(Z, 1));

      const u = {
        uT: { value: 0 },
        uMix: { value: 0 },
        uPx: { value: 3 * dpr },
        uAsp: { value: 1 },
        uPow: { value: 0 },
        uM: { value: new THREE.Vector2(9, 9) },
      };

      mat = new THREE.ShaderMaterial({
        uniforms: u,
        transparent: true,
        depthWrite: false,
        vertexShader: `attribute vec3 aB;attribute float aK,aT;uniform float uT,uMix,uPx,uAsp,uPow;uniform vec2 uM;varying float vK,vA;
void main(){vec3 p=mix(position,aB,uMix);
float br=sin(dot(position,vec3(1.7,2.3,1.1))+uT*.8)*.5+sin(dot(position,vec3(-2.1,1.3,2.9))+uT*.55)*.5;
p+=normalize(position+1e-4)*br*.03*(1.-uMix)*(aT<.5?1.:.4);
float w=sin(p.x*1.1+uT*.6)*cos(p.z*.9+uT*.4);p.y+=uMix*(w*.9-1.7);
vec4 mv=modelViewMatrix*vec4(p,1.);vec4 o=projectionMatrix*mv;
vec2 d=(o.xy/o.w-uM)*vec2(uAsp,1.);float l=length(d);float f=smoothstep(.5,0.,l);f*=f;vec2 dir=d/(l+1e-3);
mv.xy+=dir*f*(.12+.45*uPow)*(-mv.z*.1)+vec2(-dir.y,dir.x)*f*uPow*.12;mv.z+=f*(.2+.5*uPow);
gl_Position=projectionMatrix*mv;gl_PointSize=uPx*(1.+aK*1.2)*(aT<.5?1.:.75)*(1.+f*.8)*(4./-mv.z);
vK=aK;vA=(.3+.7*clamp(1.-(-mv.z-4.)/7.,0.,1.))*(aT>.5&&aT<1.5?.55:1.);}`,
        fragmentShader: `varying float vK,vA;void main(){vec2 c=gl_PointCoord-.5;if(dot(c,c)>.25)discard;gl_FragColor=vec4(mix(vec3(.96,.96,.94),vec3(.847,1.,.31),vK),vA*(.42+.5*vK));}`,
      });

      const grp = new THREE.Group();
      grp.add(new THREE.Points(geo, mat));
      sc.add(grp);

      const rs = () => {
        if (!renderer) return;
        renderer.setSize(innerWidth, innerHeight, false);
        cam.aspect = innerWidth / innerHeight;
        u.uAsp.value = cam.aspect;
        cam.position.z = innerWidth < innerHeight ? 10.5 : 7;
        cam.updateProjectionMatrix();
      };
      rs();

      const G = { x: 0, y: 0, pow: 0, spin: 0, rot: 0 };
      GL = {
        rs,
        draw(t: number, mix: number, f: number) {
          const fine = FINE && !RM,
            tx = fine ? M.nx : Math.sin(t * 0.35) * 0.5,
            ty = fine ? M.ny : Math.cos(t * 0.27) * 0.35,
            k = 1 - Math.pow(0.93, f),
            ox = G.x,
            oy = G.y;
          G.x += (tx - G.x) * k;
          G.y += (ty - G.y) * k;
          G.pow += (Math.min(1, (Math.hypot(G.x - ox, G.y - oy) / f) * 14) - G.pow) * (1 - Math.pow(0.94, f));
          G.spin = (G.spin + (G.x - ox) * 0.6) * Math.pow(0.93, f);
          G.rot += 0.0016 * f + G.spin;
          u.uT.value = RM ? 0 : t;
          u.uMix.value = mix;
          u.uM.value.set(RM ? 9 : G.x, RM ? 9 : G.y);
          u.uPow.value = RM ? 0 : G.pow;
          grp.rotation.y = (RM ? 0 : G.rot) * (1 - mix) + G.x * 0.08 * mix;
          grp.rotation.x += (mix * 0.32 - G.y * 0.12 - grp.rotation.x) * k;
          grp.rotation.z = (1 - mix) * 0.12;
          grp.scale.setScalar(0.55 + 0.45 * sm(0, 1, S.intro));
          renderer?.render(sc, cam);
        },
      };
    } catch {
      document.body.classList.add('nogl');
      const glEl = $('#gl');
      if (glEl) glEl.style.display = 'none';
    }

    /* ─── Hero title ─── */
    const T = $('#title');
    const tc = T ? split(T, 0, 1) : [];
    const tw = tc.map(() => 300);
    const S = { intro: RM ? 1 : 0 };
    if (RM) tc.forEach((c) => { c.style.fontWeight = '800'; });
    else gsap.set(tc, { yPercent: 110 });

    /* ─── Timeline ─── */
    const P: [string, string][] = [
      ['The Hush', 'Traffic thins. Windows dim in sequence. Self-monitoring drops in six of ten subjects.'],
      ['The Confessional', 'Messages grow longer and less edited. Strangers become the safest audience.'],
      ['The Fracture', 'Peak anomaly. Subjects speak aloud to empty rooms. Our instruments cannot agree on what they hear.'],
      ['The Thaw', 'Fear recedes into fatigue. Routines return like rumours.'],
      ['First Light', 'The mask is restored. No one remembers what they said.'],
    ];
    const wp = $('#wp') as unknown as SVGPathElement | null;
    const wg = $('#wg') as unknown as SVGPathElement | null;
    const hd = $('#hd');
    const sl = $('#sl');
    const sv = $('#wave');
    const ck = $('#clock');
    let L = 1, TP = 0, ph = -1;

    const upd = (p: number) => {
      TP = p;
      if (!wp || !hd || !sl || !ck) return;
      let pt = { x: 0, y: 0 };
      try {
        pt = wp.getPointAtLength(L * p);
      } catch {
        // Safe fallback before path layout is calculated
      }
      wp.style.strokeDashoffset = String(L * (1 - p));
      hd.setAttribute('cx', String(pt.x));
      hd.setAttribute('cy', String(pt.y));
      sl.setAttribute('x1', String(pt.x));
      sl.setAttribute('x2', String(pt.x));
      const m = Math.round(p * 360);
      ck.textContent = pad((m / 60) | 0) + ':' + pad(m % 60);
      ck.style.fontWeight = String(900 - Math.round(p * 700));
      const ptm = $('#ptm');
      if (ptm) ptm.textContent = ck.textContent;

      const i = Math.min(4, (p * 5) | 0);
      if (i !== ph) {
        ph = i;
        const ptEl = $('#pt');
        const pdEl = $('#pd');
        const pn2El = $('#pn2');
        if (ptEl) ptEl.textContent = P[i][0];
        if (pdEl) pdEl.textContent = P[i][1];
        if (pn2El) pn2El.textContent = 'Phase 0' + (i + 1) + ' / 05';
        if (!RM) gsap.fromTo('.phase', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' });
      }
    };

    const build = () => {
      if (!sv || !wp || !wg || !sl) return;
      const w = sv.clientWidth || innerWidth, h = sv.clientHeight || 200;
      sv.setAttribute('viewBox', `0 0 ${w} ${h}`);
      let d = '';
      for (let i = 0; i <= 140; i++) {
        const t = i / 140,
          n = Math.sin(i * 12.9898) * 43758.5453,
          j = n - Math.floor(n) - 0.5,
          a = Math.min(1, Math.max(0, (0.15 + 0.85 * Math.pow(Math.abs(t - 0.58) * 1.7, 1.6)) * 0.8 + 0.6 * Math.exp(-Math.pow((t - 0.54) * 26, 2)) + j * 0.08));
        d += (i ? 'L' : 'M') + (t * w).toFixed(1) + ' ' + (h - 8 - a * (h - 16)).toFixed(1);
      }
      wp.setAttribute('d', d);
      wg.setAttribute('d', d);
      try {
        L = wp.getTotalLength() || 1;
      } catch {
        L = 1;
      }
      wp.style.strokeDasharray = String(L);
      sl.setAttribute('y2', String(h));
      upd(TP);
    };

    build();

    const tlEl = $('#tl');
    const tlST = ScrollTrigger.create({
      trigger: tlEl,
      start: 'top top',
      end: '+=400%',
      pin: true,
      anticipatePin: 1,
      onUpdate: (s) => upd(s.progress),
    });

    const onResize = () => {
      build();
      GL?.rs();
    };
    addEventListener('resize', onResize);

    /* ─── Reveals, fills, marquee ─── */
    if (!RM) {
      $$('.sp').forEach((el) => {
        const c = split(el, 1, 1);
        gsap.from(c, {
          yPercent: 110,
          duration: 1.3,
          stagger: 0.08,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      $$('.rv').forEach((el) => {
        gsap.from(el, {
          y: 30,
          opacity: 0,
          duration: 1.2,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });

      const manEl = $('#man');
      if (manEl) {
        gsap.fromTo(
          split(manEl, 1, 0),
          { color: '#8A8A84' },
          { color: '#F5F5F0', stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#man', start: 'top 80%', end: 'bottom 50%', scrub: true } }
        );
      }

      gsap.fromTo(
        '#qt',
        { color: 'rgba(245,245,240,0)', xPercent: 6 },
        { color: '#F5F5F0', xPercent: -10, ease: 'none', scrollTrigger: { trigger: '#qt', start: 'top 90%', end: 'bottom 10%', scrub: true } }
      );
      gsap.to('#title', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('#mq', { xPercent: -50, ease: 'none', scrollTrigger: { trigger: '.end', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('.fig path,.fig .d', { strokeDashoffset: 0, ease: 'none', stagger: 0.25, scrollTrigger: { trigger: '.ins-g', start: 'top 70%', end: 'bottom 70%', scrub: true } });
    }

    $$('[data-n]').forEach((el) => {
      const n = +((el as HTMLElement).dataset.n || 0),
        d = +((el as HTMLElement).dataset.d || 0),
        o = { v: 0 },
        f = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
      if (RM) {
        el.textContent = f(n);
        return;
      }
      gsap.to(o, {
        v: n,
        duration: 2.2,
        ease: 'expo.out',
        onUpdate: () => { el.textContent = f(o.v); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    /* ─── SVG TV glitch on index rows ─── */
    const ft = $('#ft');
    const fd = $('#fd');
    if (!RM && ft && fd) {
      $$('.rows li').forEach((li) => {
        const b = li.querySelector('b');
        if (!b) return;
        li.addEventListener('pointerenter', () => {
          b.style.filter = 'url(#tv)';
          gsap.fromTo(
            fd,
            { attr: { scale: 0 } },
            {
              attr: { scale: 40 },
              duration: 0.07,
              repeat: 5,
              yoyo: true,
              onUpdate: () => ft.setAttribute('baseFrequency', (Math.random() * 0.02).toFixed(3) + ' ' + (0.2 + Math.random() * 0.5).toFixed(2)),
              onComplete: () => {
                b.style.filter = 'none';
                fd.setAttribute('scale', '0');
              },
            }
          );
        });
      });
    }

    /* ─── Nav & mobile menu ─── */
    const nav = $('#nav'), menu = $('#menu'), mb = $('#mb');
    let ly = 0, menuOpen = false, curS: string | null = null;
    const ind = $('#ind'), links = $$('.nl a[data-s]'), mo = $('#mo');
    const act = () => links.find((a) => a.classList.contains('on'));
    const go = (a?: HTMLElement) =>
      a
        ? gsap.to(ind, { x: a.offsetLeft, width: a.offsetWidth, opacity: 1, duration: 0.55, ease: 'expo.out', overwrite: true })
        : gsap.to(ind, { opacity: 0, duration: 0.3, overwrite: true });

    links.forEach((a) => {
      a.addEventListener('mouseenter', () => go(a));
      a.addEventListener('mouseleave', () => go(act()));
    });

    const od = () => $('#clk')?.classList.toggle('open', new Date().getHours() < 6);
    od();
    const odInterval = setInterval(od, 60000);

    const setA = (id: string | null) => {
      links.forEach((a) => a.classList.toggle('on', a.dataset.s === id));
      go(act());
    };

    const navTriggers = ['tl', 'ins', 'fnd', 'idx'].map((id) =>
      ScrollTrigger.create({
        trigger: id === 'tl' ? $('#tl')?.parentElement || '#tl' : '#' + id,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (t) => {
          if (t.isActive) {
            curS = id;
            setA(id);
          } else if (curS === id) {
            curS = null;
            setA(null);
          }
        },
      })
    );

    const setMenu = (o: boolean) => {
      menuOpen = o;
      menu?.classList.toggle('open', o);
      mb?.setAttribute('aria-expanded', String(o));
      if (mb) mb.textContent = o ? 'Close' : 'Menu';
      nav?.classList.remove('hid');
      if (lenis) {
        if (o) lenis.stop();
        else lenis.start();
      }
    };

    if (mb) mb.onclick = () => setMenu(!menuOpen);
    menu?.addEventListener(
      'click',
      (e) => {
        if ((e.target as HTMLElement).closest('a')) setMenu(false);
      },
      true
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    addEventListener('keydown', onKey);

    /* ─── Live Data Updates (direct DOM for 60fps stability) ─── */
    let subj = 4812093;
    const clk = () => {
      const d = new Date(), h = d.getHours();
      const clkEl = $('#clk');
      if (clkEl) clkEl.textContent = [h, d.getMinutes(), d.getSeconds()].map(pad).join(':');
      const stEl = $('#st');
      if (stEl) stEl.textContent = h < 6 ? 'Window open, observing' : 'Window closed, daylight';
    };
    clk();
    const clkInterval = setInterval(clk, 1000);

    const liveInterval = setInterval(() => {
      subj += (Math.random() * 40) | 0;
      const sjEl = $('#sj');
      if (sjEl) sjEl.textContent = subj.toLocaleString('en-US');
      const dbEl = $('#db');
      if (dbEl) dbEl.textContent = (18 + Math.random() * 7).toFixed(1);
    }, 700);

    const utc = () => {
      const d = new Date();
      const utcEl = $('#utc');
      if (utcEl) utcEl.textContent = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].map(pad).join(':');
      const utcsEl = $('#utcs');
      if (utcsEl) utcsEl.textContent = d.getUTCHours() < 6 ? 'Window open' : 'Window closed';
    };
    utc();
    const utcInterval = setInterval(utc, 1000);

    if (!RM) {
      gsap.fromTo(
        '#wm',
        { color: 'rgba(245,245,240,0)' },
        { color: '#F5F5F0', ease: 'none', scrollTrigger: { trigger: '#wm', start: 'top bottom', end: 'bottom bottom', scrub: true } }
      );
    }

    /* ─── Master Loop (gsap.ticker) ─── */
    const bar = $('#bar');
    const masterTick = (t: number, dms?: number) => {
      const y = lenis ? lenis.scroll : scrollY,
        H = innerHeight,
        f = Math.min(dms || 16.7, 50) / 16.67;

      // Cursor physics - always active when elements exist
      if (dot && ring) {
        const dk = Math.pow(0.78, f);
        vx = (vx + (M.x - rx) * 0.11 * f) * dk;
        vy = (vy + (M.y - ry) * 0.11 * f) * dk;
        rx += vx * f;
        ry += vy * f;
        dot.style.transform = `translate3d(${M.x}px,${M.y}px,0)`;
        ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      }

      // Title weight reaction
      if (!RM && y < H) {
        const k = 1 - Math.pow(0.88, f);
        tc.forEach((c, i) => {
          const r = c.getBoundingClientRect(),
            d = Math.hypot(M.x - (r.left + r.width / 2), (M.y - (r.top + r.height / 2)) * 0.5) / innerWidth,
            w = FINE ? 300 + 600 * Math.exp(-d * d * 40) : 550 + 350 * Math.sin(t * 0.8 + i * 0.7);
          tw[i] += (w - tw[i]) * k;
          c.style.fontWeight = String(tw[i] | 0);
        });
      }

      // WebGL points
      if (GL) {
        const mix = sm(tlST.start - H, tlST.end, y) * (1 - sm(tlST.end, tlST.end + H, y));
        const glEl = $('#gl');
        if (glEl) glEl.style.opacity = String(S.intro * (0.2 + 0.5 * (1 - sm(0, H * 0.9, y))));
        GL.draw(t, mix, f);
      }

      // Nav visibility on scroll
      if (!menuOpen && nav) {
        const dy = y - ly;
        if (y < H * 0.4 || dy < -4) nav.classList.remove('hid');
        else if (dy > 4) nav.classList.add('hid');
      }
      ly = y;

      if (nav) {
        nav.classList.toggle('sc', y > 40);
        const sp = Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - H));
        nav.style.setProperty('--p', sp.toFixed(4));
        if (mo) mo.setAttribute('cx', (24 - 14 * sp).toFixed(2));
      }

      if (bar) {
        bar.style.transform = `scaleY(${Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - H))})`;
      }
    };
    gsap.ticker.add(masterTick);

    /* ─── Preloader / Intro ─── */
    if (RM) {
      $('#pre')?.remove();
    } else {
      const C = { v: 0 };
      gsap.to(C, {
        v: 100,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          const pnEl = $('#pn');
          if (pnEl) pnEl.textContent = String(Math.round(C.v)).padStart(3, '0');
        },
        onComplete: () => {
          gsap
            .timeline({ defaults: { ease: 'expo.out' } })
            .to('#pre', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
            .to(tc, { yPercent: 0, duration: 1.6, stagger: 0.06 }, '-=.5')
            .from('.hero .row,.hero .q,.hero .mono', { opacity: 0, y: 20, stagger: 0.1, duration: 1 }, '-=1.1')
            .to(S, { intro: 1, duration: 2.5, ease: 'none' }, '<')
            .from('.ret', { opacity: 0, scale: 0.82, duration: 2.2, ease: 'expo.out' }, '<');
          lenis?.start();
          ScrollTrigger.refresh();
        },
      });
    }

    /* ─── Cleanup on unmount ─── */
    return () => {
      document.removeEventListener('click', onAnchorClick);
      removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      removeEventListener('resize', onResize);
      removeEventListener('keydown', onKey);
      clearInterval(odInterval);
      clearInterval(clkInterval);
      clearInterval(liveInterval);
      clearInterval(utcInterval);
      gsap.ticker.remove(masterTick);
      tlST.kill();
      navTriggers.forEach((tr) => tr.kill());
      lenis?.destroy();
      renderer?.dispose();
      geo?.dispose();
      mat?.dispose();
    };
  }, []);

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="tv">
          <feTurbulence id="ft" type="fractalNoise" baseFrequency="0 .3" numOctaves={1} result="n" />
          <feDisplacementMap id="fd" in="SourceGraphic" in2="n" scale={0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <canvas id="gl" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="bar" id="bar" />
      <div className="cur" aria-hidden="true">
        <div className="ring"><i /></div>
        <div className="dot" />
      </div>
      <div id="pre" aria-hidden="true">
        <div className="mono">Calibrating instruments. Keep the lights low</div>
        <div id="pn">000</div>
      </div>
      <nav id="nav">
        <a href="#top" className="mono brand">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <mask id="mm">
                <rect width="20" height="20" fill="#fff" />
                <circle id="mo" cx="24" cy="10" r="8" fill="#000" />
              </mask>
            </defs>
            <circle cx="10" cy="10" r="8" fill="none" stroke="#F5F5F0" strokeOpacity=".5" />
            <circle cx="10" cy="10" r="8" fill="#F5F5F0" mask="url(#mm)" />
          </svg>
          Nocturne
        </a>
        <span className="mono hide-s" id="clk">00:00:00</span>
        <div className="nl mono">
          <a href="#tl" data-s="tl"><em>02</em>Watch</a>
          <a href="#ins" data-s="ins"><em>03</em>Instruments</a>
          <a href="#idx" data-s="idx"><em>05</em>Index</a>
          <a href="#join" className="cta">Join</a>
          <i id="ind" />
        </div>
        <button className="mb mono" id="mb" aria-expanded="false" aria-controls="menu">
          Menu
        </button>
      </nav>
      <div id="menu">
        <a href="#tl">Watch</a>
        <a href="#ins">Instruments</a>
        <a href="#fnd">Findings</a>
        <a href="#idx">Index</a>
        <a href="#join">Join</a>
      </div>
      <main id="top">
        <header className="hero">
          <div className="ret" aria-hidden="true"><i /><b /></div>
          <div className="row mono">
            <span className="rec" id="st">Window open</span>
            <span>Hours 00:00 → 06:00</span>
          </div>
          <div>
            <h1 id="title">NOCTURNE</h1>
            <div className="row" style={{ alignItems: 'flex-end', marginTop: '3vh' }}>
              <p className="q">What happens to humanity when the world goes quiet?</p>
              <span className="mono">Descend ↓</span>
            </div>
          </div>
        </header>
        <section className="man pad">
          <p className="mono rv">[ 01 / Premise ]</p>
          <p id="man">
            Between midnight and sunrise the masks we wear for daylight go slack. People confess to strangers, to screens, to ceilings. We do not intervene. We only listen, with sensors, with patience, with the lights off.
          </p>
          <div id="qt" className="o" aria-hidden="true">QUIET</div>
        </section>
        <section className="tl" id="tl">
          <div className="row mono">
            <span>[ 02 / The Watch ]</span>
            <span id="pn2">Phase 01 / 05</span>
          </div>
          <div className="wv">
            <svg id="wave" aria-hidden="true">
              <line id="sl" y1="0" stroke="rgba(255,255,255,.15)" />
              <path id="wg" fill="none" stroke="rgba(255,255,255,.15)" />
              <path id="wp" fill="none" stroke="#F5F5F0" strokeWidth="1.5" />
              <circle id="hd" r="5" fill="#D8FF4F" />
            </svg>
          </div>
          <div className="hrs mono">
            <span>00</span><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span>
          </div>
          <div id="clock" aria-hidden="true">00:00</div>
          <div className="phase" aria-live="polite">
            <div className="mono" id="ptm">00:00</div>
            <h3 id="pt">The Hush</h3>
            <p id="pd" />
          </div>
        </section>
        <section className="pad" id="ins">
          <p className="mono rv">[ 03 / Instruments ]</p>
          <h2>
            <span className="sp">Four ways</span> <span className="sp o">of listening</span>
          </h2>
          <div className="ins-g">
            <svg className="fig" viewBox="0 0 400 400" aria-hidden="true">
              <circle className="d" cx="200" cy="200" r="180" pathLength={1} />
              <circle className="d" cx="200" cy="200" r="130" pathLength={1} />
              <path d="M200 90A110 110 0 1 0 200 310A80 110 0 1 1 200 90Z" pathLength={1} />
              <path d="M20 200H380M200 20V380" pathLength={1} stroke="rgba(255,255,255,.15)" />
              <circle cx="200" cy="90" r="4" fill="#D8FF4F" stroke="none" />
            </svg>
            <ol>
              <li className="rv">
                <span className="mono">I</span>
                <div>
                  <h4>The Acoustic Array</h4>
                  <p>
                    Four hundred contact microphones laid across rooftops and rail yards. They hear the city exhale: compressors cycling off, a single dog, a stranger laughing at 02:11.
                  </p>
                </div>
              </li>
              <li className="rv">
                <span className="mono">II</span>
                <div>
                  <h4>Thermal Drift</h4>
                  <p>
                    Infrared masts log how bodies cool and cluster. A lit window is a warm confession; we count them the way astronomers count stars.
                  </p>
                </div>
              </li>
              <li className="rv">
                <span className="mono">III</span>
                <div>
                  <h4>The Window Census</h4>
                  <p>
                    Every lit window after midnight is a data point. We chart who stays awake, and who stays awake together.
                  </p>
                </div>
              </li>
              <li className="rv">
                <span className="mono">IV</span>
                <div>
                  <h4>The Confession Corpus</h4>
                  <p>
                    Consented, anonymised, scrubbed of names. After 02:00 language changes: shorter nouns, longer silences, more first-person truths.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
        <section className="pad" id="fnd">
          <p className="mono rv">[ 04 / Findings ]</p>
          <div className="stats">
            <div><b data-n="14200">0</b><span className="mono">Nights recorded</span></div>
            <div><b data-n="212">0</b><span className="mono">Cities observed</span></div>
            <div><b data-n="3.4" data-d="1">0</b><span className="mono">dB, median hush</span></div>
            <div><b>03:14</b><span className="mono">Hour of peak candour</span></div>
          </div>
          <p className="pull sp">At 03:14, nine in ten subjects say something true.</p>
          <p className="mono live rv">
            Live: subjects online <b id="sj">4,812,093</b> · ambient <b id="db">21.4</b> dB
          </p>
        </section>
        <section className="pad" id="idx">
          <p className="mono rv">[ 05 / Index of Observations ]</p>
          <h2>
            <span className="sp">Subjects</span> <span className="sp o">of the quiet</span>
          </h2>
          <ul className="rows">
            <li data-cur><span className="mono">014</span><b>The Chorus of Insomniacs</b><span className="mono">01:12 / Seoul</span></li>
            <li data-cur><span className="mono">027</span><b>Night-Shift Cartography</b><span className="mono">02:40 / Lagos</span></li>
            <li data-cur><span className="mono">031</span><b>Rooms That Answer Back</b><span className="mono">03:14 / Reykjavík</span></li>
            <li data-cur><span className="mono">044</span><b>The Last Open Window</b><span className="mono">03:58 / Osaka</span></li>
            <li data-cur><span className="mono">052</span><b>Letters Never Sent</b><span className="mono">04:31 / Lisbon</span></li>
            <li data-cur><span className="mono">066</span><b>Birdsong Before Light</b><span className="mono">05:47 / Nairobi</span></li>
          </ul>
        </section>
        <section className="end" id="join">
          <p className="mono rv" style={{ padding: '0 4vw 4vh' }}>[ 06 / Join the watch ]</p>
          <div className="mq o" id="mq" aria-hidden="true">
            <span>STAY AWAKE / STAY AWAKE / </span>
            <span>STAY AWAKE / STAY AWAKE / </span>
          </div>
          <p className="q" style={{ margin: '8vh 4vw 0' }}>
            Night passes admit forty observers a month. You will be asked to stay awake.
          </p>
          <a className="btn" data-cur href="#top">
            Request a night pass <span>→</span>
          </a>
          <footer className="foot">
            <div className="fgrid">
              <div>
                <p className="mono">Station</p>
                Observatory of the Quiet Hours<br />
                Open 00:00 to 06:00 UTC<br />
                Closed to daylight
              </div>
              <div>
                <p className="mono">Navigate</p>
                <a href="#tl">The Watch</a>
                <a href="#ins">Instruments</a>
                <a href="#fnd">Findings</a>
                <a href="#idx">Index</a>
              </div>
              <div>
                <p className="mono">Correspondence</p>
                <a className="ul" href="mailto:watch@nocturne.example">watch@nocturne.example</a>
                @nocturne.observatory
              </div>
              <div>
                <p className="mono">Observatory time</p>
                <b id="utc" className="big">00:00:00</b>
                <span className="mono" id="utcs" />
              </div>
            </div>
            <div className="wm o" id="wm" aria-hidden="true">NOCTURNE</div>
            <div className="mono row legal">
              <span>© Nocturne, a fictional institute. No names are recorded.</span>
              <a href="#top">↑ Return to the surface</a>
            </div>
          </footer>
        </section>
      </main>
    </>
  );
}
