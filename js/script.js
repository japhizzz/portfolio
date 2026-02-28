// ========== LOADING SCREEN ==========
(function () {
    const screen  = document.getElementById('loadingScreen');
    const fill    = document.getElementById('lsBarFill');
    const pctEl   = document.getElementById('lsPercent');
    if (!screen || !fill || !pctEl) return;

    let current = 0;
    let target  = 0;
    const isMobile = window.innerWidth <= 768;

    // Animasi angka & bar dengan interpolasi smooth
    function setProgress(val) {
        target = Math.min(Math.max(val, target), 100);
    }

    function tick() {
        if (current < target) {
            current = Math.min(current + Math.max((target - current) * 0.08, 0.5), target);
            const v = Math.floor(current);
            pctEl.textContent = v;
            if (isMobile) {
                fill.style.width = v + '%';
            } else {
                fill.style.height = v + '%';
            }
        }
        if (current < 100) {
            requestAnimationFrame(tick);
        } else {
            // Tunggu sebentar lalu dismiss
            setTimeout(dismiss, 350);
        }
    }
    requestAnimationFrame(tick);

    function dismiss() {
        screen.classList.add('ls-done');
        // Hapus dari DOM setelah transisi selesai
        screen.addEventListener('transitionend', () => screen.remove(), { once: true });
    }

    // Checkpoint weights — total harus = 100
    // DOM parse selesai:       20
    // Fonts ready:             15
    // Images/resources loaded: 30
    // GSAP tersedia:           15
    // WebGL/canvas init:       15
    // Fallback timeout:        (jaga-jaga)
    let scored = 0;
    function score(pts) {
        scored = Math.min(scored + pts, 98); // max 98, 100 di window.load
        setProgress(scored);
    }

    // Checkpoint 1: DOM parse (dipanggil langsung karena script defer/DOMContentLoaded)
    score(20);

    // Checkpoint 2: Fonts
    document.fonts.ready.then(() => score(15));

    // Checkpoint 3: GSAP tersedia (script GSAP di-load di index.html)
    function checkGSAP() {
        if (typeof gsap !== 'undefined') {
            score(15);
        } else {
            setTimeout(checkGSAP, 50);
        }
    }
    checkGSAP();

    // Checkpoint 4: WebGL canvas init
    function checkWebGL() {
        const c = document.getElementById('galaxyCanvas');
        if (c && (c.getContext('webgl') || c.getContext('experimental-webgl'))) {
            score(15);
        } else if (c) {
            // WebGL tidak support, tetap lanjut
            score(15);
        } else {
            setTimeout(checkWebGL, 80);
        }
    }
    setTimeout(checkWebGL, 100);

    // Checkpoint 5: window.load = semua resource (gambar, CSS, dst) selesai
    window.addEventListener('load', () => {
        score(35);
        // Pastikan angka sampai 100 dengan rapi
        setTimeout(() => setProgress(100), 100);
    });

    // Fallback: kalau dalam 8 detik belum selesai, force dismiss
    setTimeout(() => setProgress(100), 8000);
})();

document.addEventListener('DOMContentLoaded', () => {
    initShootingStars();
    initThemeCycle();
    initGalaxyBg();
    initTypewriter();
    initPillNav();
    initMobileNav();
    initScrollReveal();
    initSkillBars();
    initMagicBento();
    initCircularGallery();
    initLightbox();
});

// ========== SHOOTING STARS FALLBACK (Canvas 2D, no WebGL) ==========
function initShootingStars() {
    const canvas = document.getElementById('shootingStarsCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('home');

    // Gunakan ukuran hero section, bukan canvas (karena canvas masih display:none)
    function resize() {
        const rect = hero ? hero.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        canvas.width  = rect.width  || window.innerWidth;
        canvas.height = rect.height || window.innerHeight;
    }
    window.addEventListener('resize', () => { resize(); spawnStars(); });

    // ── Bintang statis ────────────────────────────────────────────────────────
    const STAR_COUNT = 120;
    const stars = [];

    function spawnStars() {
        stars.length = 0;
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x:            Math.random() * canvas.width,
                y:            Math.random() * canvas.height,
                r:            Math.random() * 2.5 + 1.0,
                opacity:      Math.random() * 0.5 + 0.45,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOff:   Math.random() * Math.PI * 2,
            });
        }
    }

    // ── Shooting stars ────────────────────────────────────────────────────────
    const MAX_METEORS = 5;
    const meteors = [];
    const ANGLE = Math.PI / 5;

    function spawnMeteor() {
        const speed = Math.random() * 6 + 4;
        return {
            x:       Math.random() * canvas.width,
            y:       Math.random() * canvas.height * 0.4,
            vx:      Math.cos(ANGLE) * speed,
            vy:      Math.sin(ANGLE) * speed,
            len:     Math.random() * 120 + 60,
            width:   Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.7 + 0.3,
            life:    0,
            decay:   Math.random() * 0.008 + 0.004,
        };
    }

    function getColors() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        return {
            isLight,
            bgTop:      isLight ? '#e8e8f0' : '#050510',
            bgBottom:   isLight ? '#dcdcec' : '#0a0a1a',
            starColor:  isLight ? 'rgba(90,79,255,'   : 'rgba(180,170,255,',
            meteorHead: isLight ? 'rgba(90,79,255,'   : 'rgba(200,190,255,',
            meteorTail: isLight ? 'rgba(90,79,255,0)' : 'rgba(140,130,255,0)',
        };
    }

    let ssRaf = null;
    let lastSpawn = 0;
    let initialized = false;

    function drawFrame(t) {
        if (document.hidden) { ssRaf = null; return; }
        ssRaf = requestAnimationFrame(drawFrame);

        const W = canvas.width, H = canvas.height;
        if (!W || !H) return; // safety check
        const c = getColors();

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, c.bgTop);
        grad.addColorStop(1, c.bgBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Bintang statis
        stars.forEach(s => {
            const twinkle = Math.sin(t * 0.001 * s.twinkleSpeed * 60 + s.twinkleOff) * 0.3 + 0.7;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = c.starColor + (s.opacity * twinkle) + ')';
            ctx.fill();
        });

        // Spawn meteor baru
        if (meteors.length < MAX_METEORS && (t - lastSpawn) > (Math.random() * 2000 + 1200)) {
            meteors.push(spawnMeteor());
            lastSpawn = t;
        }

        // Update & draw meteors
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.x += m.vx;
            m.y += m.vy;
            m.life += m.decay;

            let alpha = m.opacity;
            if      (m.life < 0.3) alpha *= m.life / 0.3;
            else if (m.life > 0.7) alpha *= 1 - (m.life - 0.7) / 0.3;

            const tailX = m.x - Math.cos(ANGLE) * m.len;
            const tailY = m.y - Math.sin(ANGLE) * m.len;
            const mg = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
            mg.addColorStop(0, c.meteorTail);
            mg.addColorStop(1, c.meteorHead + alpha + ')');

            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = mg;
            ctx.lineWidth = m.width;
            ctx.lineCap = 'round';
            ctx.stroke();

            if (m.life >= 1 || m.x > W + 150 || m.y > H + 150) {
                meteors.splice(i, 1);
                lastSpawn = t;
            }
        }
    }

    canvas._startShootingStars = () => {
        // Resize & spawn bintang di sini, saat canvas sudah visible
        resize();
        spawnStars();

        // Spawn beberapa meteor awal supaya tidak kosong
        meteors.length = 0;
        for (let i = 0; i < 3; i++) {
            const m = spawnMeteor();
            m.life = Math.random() * 0.4;
            meteors.push(m);
        }

        canvas.style.display = 'block';
        if (!ssRaf) ssRaf = requestAnimationFrame(drawFrame);
    };

    canvas._stopShootingStars = () => {
        canvas.style.display = 'none';
        if (ssRaf) { cancelAnimationFrame(ssRaf); ssRaf = null; }
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && canvas.style.display !== 'none' && !ssRaf) {
            ssRaf = requestAnimationFrame(drawFrame);
        }
    });
}

// ========== THEME ==========
function initThemeCycle() {
    const btn = document.getElementById('themeCycleBtn');
    const modes = ['system', 'dark', 'light'];
    let current = localStorage.getItem('theme') || 'system';
    function apply(mode) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode);
        btn.querySelectorAll('.theme-icon').forEach(i => i.classList.remove('visible'));
        btn.querySelector(`.icon-${mode}`).classList.add('visible');
    }
    apply(current);
    btn.addEventListener('click', () => {
        current = modes[(modes.indexOf(current) + 1) % modes.length];
        localStorage.setItem('theme', current);
        apply(current);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('theme') || 'system') === 'system') apply('system');
    });
}

// ========== GALAXY BG (WebGL GLSL Shader) ==========
function initGalaxyBg() {
    const canvas = document.getElementById('galaxyCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { canvas.style.display = 'none'; return; }

    function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const vertSrc = `
        attribute vec2 position;
        void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `;

    // ── DARK MODE SHADER: colourful stars on deep-space black ──────────────
    // ── DARK MODE SHADER: single accent-color stars, lightweight ──────────
    const fragDark = `
        precision highp float;
        uniform float uTime;
        uniform vec2  uResolution;
        uniform vec2  uMouse;
        uniform float uMouseActive;

        #define NUM_LAYER 3.0

        float Hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
        float tri(float x){return abs(fract(x)*2.0-1.0);}
        float tris(float x){float t=fract(x);return 1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0));}
        float trisn(float x){float t=fract(x);return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0;}

        float Star(vec2 uv){
            float d=length(uv);
            float m=0.012/d;
            m*=smoothstep(1.0,0.2,d);
            return m;
        }

        float StarLayer(vec2 uv, float starSpeed){
            float val=0.0;
            vec2 gv=fract(uv)-0.5;
            vec2 id=floor(uv);
            for(int y=-1;y<=1;y++){
                for(int x=-1;x<=1;x++){
                    vec2 si=id+vec2(float(x),float(y));
                    float seed=Hash21(si);
                    float size=fract(seed*345.32);
                    vec2 pad=vec2(tris(seed*34.0+uTime*0.1),tris(seed*38.0+uTime/30.0))-0.5;
                    float star=Star(gv-vec2(float(x),float(y))-pad);
                    float twinkle=trisn(uTime+seed*6.2831)*0.5+1.0;
                    star*=mix(1.0,twinkle,0.3);
                    val+=star*size;
                }
            }
            return val;
        }

        void main(){
            // accent color: #6c63ff = vec3(0.424, 0.388, 1.0)
            vec3 accentCol = vec3(0.424, 0.388, 1.0);
            vec3 bgCol = vec3(0.020, 0.020, 0.059);
            vec2 uv=(gl_FragCoord.xy-uResolution*0.5)/uResolution.y;
            vec2 mouseNorm=(uMouse-uResolution*0.5)/uResolution.y;
            float mouseDist=length(uv-mouseNorm);
            vec2 pull=normalize(mouseNorm-uv+0.0001)*(0.9/(mouseDist*mouseDist+0.15));
            uv+=pull*0.06*uMouseActive;
            float angle=uTime*0.06;
            mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
            uv=rot*uv;
            float brightness=0.0;
            float starSpeed=uTime*0.005;
            for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
                float depth=fract(i+starSpeed);
                float scale=mix(18.0,0.5,depth);
                float fade=depth*smoothstep(1.0,0.9,depth);
                brightness+=StarLayer(uv*scale+i*453.32,starSpeed)*fade;
            }
            vec3 col = bgCol + accentCol * brightness * 0.9;
            col = clamp(col, 0.0, 1.0);
            gl_FragColor=vec4(col,1.0);
        }
    `;

    // ── LIGHT MODE SHADER: monochrome dark dots on pale website background ──
    // Background matches --hero-bg: #e8e8f0. Stars are dark grey, no colour.
    // ── LIGHT MODE SHADER: monochrome dark dots on pale background, lightweight ──
    const fragLight = `
        precision highp float;
        uniform float uTime;
        uniform vec2  uResolution;
        uniform vec2  uMouse;
        uniform float uMouseActive;

        #define NUM_LAYER 3.0

        float Hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
        float tris(float x){float t=fract(x);return 1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0));}
        float trisn(float x){float t=fract(x);return 2.0*(1.0-smoothstep(0.0,1.0,abs(2.0*t-1.0)))-1.0;}

        float Star(vec2 uv){
            float d=length(uv);
            float m=0.012/d;
            m*=smoothstep(1.0,0.2,d);
            return m;
        }

        float StarLayer(vec2 uv, float starSpeed){
            float val=0.0;
            vec2 gv=fract(uv)-0.5;
            vec2 id=floor(uv);
            for(int y=-1;y<=1;y++){
                for(int x=-1;x<=1;x++){
                    vec2 si=id+vec2(float(x),float(y));
                    float seed=Hash21(si);
                    float size=fract(seed*345.32);
                    vec2 pad=vec2(tris(seed*34.0+uTime*0.1),tris(seed*38.0+uTime/30.0))-0.5;
                    float star=Star(gv-vec2(float(x),float(y))-pad);
                    float twinkle=trisn(uTime+seed*6.2831)*0.5+1.0;
                    star*=mix(1.0,twinkle,0.3);
                    val+=star*size;
                }
            }
            return val;
        }

        void main(){
            vec3 bgCol = vec3(0.910, 0.910, 0.941);
            vec2 uv=(gl_FragCoord.xy-uResolution*0.5)/uResolution.y;
            vec2 mouseNorm=(uMouse-uResolution*0.5)/uResolution.y;
            float mouseDist=length(uv-mouseNorm);
            vec2 pull=normalize(mouseNorm-uv+0.0001)*(0.9/(mouseDist*mouseDist+0.15));
            uv+=pull*0.06*uMouseActive;
            float angle=uTime*0.06;
            mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
            uv=rot*uv;
            float brightness=0.0;
            float starSpeed=uTime*0.005;
            for(float i=0.0;i<1.0;i+=1.0/NUM_LAYER){
                float depth=fract(i+starSpeed);
                float scale=mix(18.0,0.5,depth);
                float fade=depth*smoothstep(1.0,0.9,depth);
                brightness+=StarLayer(uv*scale+i*453.32,starSpeed)*fade;
            }
            vec3 col = bgCol - vec3(brightness * 0.55);
            col = clamp(col, 0.0, 1.0);
            gl_FragColor=vec4(col,1.0);
        }
    `;

    function buildProgram(fSrc) {
        function compile(src, type) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }
        const p = gl.createProgram();
        gl.attachShader(p, compile(vertSrc, gl.VERTEX_SHADER));
        gl.attachShader(p, compile(fSrc, gl.FRAGMENT_SHADER));
        gl.linkProgram(p);
        return p;
    }

    const progDark  = buildProgram(fragDark);
    const progLight = buildProgram(fragLight);

    // Shared geometry — full-screen triangle
    const verts = new Float32Array([-1,-1, 3,-1, -1,3]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    function useProgram(p) {
        gl.useProgram(p);
        const posLoc = gl.getAttribLocation(p, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        return {
            uTime:        gl.getUniformLocation(p, 'uTime'),
            uRes:         gl.getUniformLocation(p, 'uResolution'),
            uMouse:       gl.getUniformLocation(p, 'uMouse'),
            uMouseActive: gl.getUniformLocation(p, 'uMouseActive'),
        };
    }

    const unifDark  = useProgram(progDark);
    const unifLight = useProgram(progLight);

    // ── Mouse tracking: document-level so it works across the full hero ──
    let mx = canvas.width / 2, my = canvas.height / 2;
    let tmx = mx, tmy = my, mouseActive = 0, targetMouseActive = 0;

    document.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        // Only activate repulsion while mouse is over the hero canvas
        if (e.clientY >= r.top && e.clientY <= r.bottom &&
            e.clientX >= r.left && e.clientX <= r.right) {
            tmx = e.clientX - r.left;
            tmy = canvas.height - (e.clientY - r.top); // WebGL Y is flipped
            targetMouseActive = 1;
        } else {
            targetMouseActive = 0;
        }
    });
    document.addEventListener('mouseleave', () => { targetMouseActive = 0; });

    let galaxyEnabled = true;
    let rafId = null;

    // ── Optimasi 1: Pause galaxy saat tab tidak aktif ─────────────────────────
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && galaxyEnabled && !rafId) {
            rafId = requestAnimationFrame(render);
        }
    });

    // ── Optimasi 2: Pause galaxy saat scroll jauh dari hero section ───────────
    const heroSection = document.getElementById('home');
    let galaxyInView = true;

    const heroObserver = new IntersectionObserver(([entry]) => {
        galaxyInView = entry.isIntersecting;
        // Restart loop jika kembali ke hero dan galaxy aktif
        if (galaxyInView && galaxyEnabled && !rafId) {
            rafId = requestAnimationFrame(render);
        }
    }, { threshold: 0, rootMargin: '100px 0px 100px 0px' });

    if (heroSection) heroObserver.observe(heroSection);

    // ── Throttle galaxy ke 30fps ──────────────────────────────────────────────
    const GALAXY_FPS = 30;
    const GALAXY_INTERVAL = 1000 / GALAXY_FPS; // ~33.33ms per frame
    let lastGalaxyFrame = 0;

    function render(t) {
        // Hentikan loop jika tab hidden atau hero tidak terlihat
        if (document.hidden || !galaxyInView) {
            rafId = null;
            return;
        }
        rafId = requestAnimationFrame(render);
        if (!galaxyEnabled) return;

        // Skip frame jika belum waktunya (throttle 30fps)
        if (t - lastGalaxyFrame < GALAXY_INTERVAL) return;
        lastGalaxyFrame = t;

        const ts = t * 0.001;
        mx += (tmx - mx) * 0.05;
        my += (tmy - my) * 0.05;
        mouseActive += (targetMouseActive - mouseActive) * 0.05;

        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const prog  = isLight ? progLight  : progDark;
        const unif  = isLight ? unifLight  : unifDark;

        gl.useProgram(prog);
        const posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(unif.uTime,        ts);
        gl.uniform2f(unif.uRes,         canvas.width, canvas.height);
        gl.uniform2f(unif.uMouse,       mx, my);
        gl.uniform1f(unif.uMouseActive, mouseActive);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // ── Auto-benchmark: render 10 frame, ukur rata-rata waktu per frame ─────
    // Kalau rata-rata > 40ms (di bawah 25fps), device dianggap low-end
    // dan galaxy di-off otomatis sebelum user sempat lihat lag
    const BENCHMARK_FRAMES  = 10;
    const BENCHMARK_THRESHOLD = 40; // ms — di bawah 25fps dianggap lemah
    let   benchFrames = 0;
    let   benchStart  = null;
    let   benchDone   = false;

    function benchmarkRender(t) {
        if (benchFrames === 0) benchStart = t;
        benchFrames++;

        // Render frame seperti biasa selama benchmark
        const ts = t * 0.001;
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const prog = isLight ? progLight : progDark;
        const unif = isLight ? unifLight : unifDark;
        gl.useProgram(prog);
        const posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(unif.uTime,        ts);
        gl.uniform2f(unif.uRes,         canvas.width, canvas.height);
        gl.uniform2f(unif.uMouse,       mx, my);
        gl.uniform1f(unif.uMouseActive, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (benchFrames < BENCHMARK_FRAMES) {
            requestAnimationFrame(benchmarkRender);
            return;
        }

        // Benchmark selesai — hitung rata-rata per frame
        const avgMs = (t - benchStart) / BENCHMARK_FRAMES;
        benchDone = true;

        if (avgMs > BENCHMARK_THRESHOLD) {
            // Device lemah — matikan galaxy, aktifkan shooting stars fallback
            galaxyEnabled = false;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            canvas.style.opacity = '0';

            // Aktifkan shooting stars Canvas 2D sebagai fallback
            const ssCanvas = document.getElementById('shootingStarsCanvas');
            if (ssCanvas && ssCanvas._startShootingStars) ssCanvas._startShootingStars();

            const toggleBtn = document.getElementById('galaxyToggleBtn');
            if (toggleBtn) {
                const iconOn  = toggleBtn.querySelector('.galaxy-icon-on');
                const iconOff = toggleBtn.querySelector('.galaxy-icon-off');
                const label   = toggleBtn.querySelector('.galaxy-toggle-label');
                iconOn.style.display  = 'none';
                iconOff.style.display = '';
                label.textContent = 'Galaxy: OFF';
                toggleBtn.classList.add('galaxy-off');
            }

            // Notif kecil di pojok — hilang sendiri setelah 5 detik
            const notif = document.createElement('div');
            notif.textContent = '⚡ Galaxy animation disabled automatically for optimal performance';
            notif.style.cssText = `
                position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.75); color: #fff; font-size: 12px;
                padding: 8px 16px; border-radius: 20px; z-index: 9999;
                backdrop-filter: blur(8px); pointer-events: none;
                opacity: 1; transition: opacity 1s ease;
            `;
            document.body.appendChild(notif);
            setTimeout(() => { notif.style.opacity = '0'; }, 4000);
            setTimeout(() => { notif.remove(); }, 5000);

        } else {
            // Device kuat — lanjut render normal
            requestAnimationFrame(render);
        }
    }

    // Mulai benchmark saat halaman load
    requestAnimationFrame(benchmarkRender);

    // ── Galaxy Toggle Button ──────────────────────────────────────────────────
    const toggleBtn = document.getElementById('galaxyToggleBtn');
    if (toggleBtn) {
        const iconOn  = toggleBtn.querySelector('.galaxy-icon-on');
        const iconOff = toggleBtn.querySelector('.galaxy-icon-off');
        const label   = toggleBtn.querySelector('.galaxy-toggle-label');

        toggleBtn.addEventListener('click', () => {
            galaxyEnabled = !galaxyEnabled;

            if (galaxyEnabled) {
                canvas.style.opacity = '1';
                iconOn.style.display  = '';
                iconOff.style.display = 'none';
                label.textContent = 'Galaxy: ON';
                toggleBtn.classList.remove('galaxy-off');
                // Pastikan render loop jalan kembali
                if (!rafId) rafId = requestAnimationFrame(render);
            } else {
                // Clear canvas to transparent/black when disabled
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                canvas.style.opacity = '0';
                iconOn.style.display  = 'none';
                iconOff.style.display = '';
                label.textContent = 'Galaxy: OFF';
                toggleBtn.classList.add('galaxy-off');
            }
        });
    }
}

// ========== TYPEWRITER ==========
function initTypewriter() {
    const el=document.getElementById('typewriter');if(!el)return;
    const ph=['Computer Troubleshooting Expert','Hardware Diagnostics and Repair','Networking Basics Enthusiast','Coding Fundamentals Learner','Always Learning, Always Growing'];
    let p=0,c=0,d=false,s=70;
    function t(){const cur=ph[p];el.textContent=d?cur.substring(0,--c):cur.substring(0,++c);s=d?35:70;if(!d&&c===cur.length){s=2000;d=true;}else if(d&&c===0){d=false;p=(p+1)%ph.length;s=400;}setTimeout(t,s);}
    setTimeout(t,800);
}

// ========== PILL NAV ==========
function initPillNav() {
    const nav=document.getElementById('pillNav');if(!nav)return;
    const ind=document.getElementById('pillIndicator'),links=nav.querySelectorAll('.pill-link'),secs=document.querySelectorAll('section[id]');
    function mv(t){const r=t.getBoundingClientRect(),pr=t.parentElement.getBoundingClientRect();ind.style.left=(r.left-pr.left)+'px';ind.style.width=r.width+'px';}
    const a=nav.querySelector('.pill-link.active');if(a)requestAnimationFrame(()=>mv(a));
    links.forEach(l=>l.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));l.classList.add('active');mv(l);}));
    window.addEventListener('scroll',()=>{let cur='';secs.forEach(s=>{if(window.scrollY>=s.offsetTop-120)cur=s.id;});links.forEach(l=>{l.classList.toggle('active',l.dataset.section===cur);if(l.dataset.section===cur)mv(l);});});
    window.addEventListener('resize',()=>{const a=nav.querySelector('.pill-link.active');if(a)mv(a);});
}

// ========== MOBILE NAV ==========
function initMobileNav() {
    const ls=document.querySelectorAll('.mobile-pill-link'),ss=document.querySelectorAll('section[id]');
    window.addEventListener('scroll',()=>{let c='';ss.forEach(s=>{if(window.scrollY>=s.offsetTop-120)c=s.id;});ls.forEach(l=>l.classList.toggle('active',l.dataset.section===c));});
}

// ========== SCROLL REVEAL ==========
function initScrollReveal() {
    const els=document.querySelectorAll('.reveal-up,.reveal-text');
    const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});
    els.forEach(el=>obs.observe(el));
}

// ========== SKILL BARS ==========
function initSkillBars() {
    const bars=document.querySelectorAll('.skill-bar-fill');
    const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.style.width=e.target.dataset.width+'%';});},{threshold:0.3});
    bars.forEach(b=>obs.observe(b));
}

// ========== MAGIC BENTO (Dynamic border glow) ==========
function initMagicBento() {
    document.querySelectorAll('[data-bento]').forEach(card => {
        const glow = card.querySelector('.bento-border-glow');
        if (!glow) return;

        let rafPending = false;
        let lastX = 0, lastY = 0;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
            card.classList.add('bento-active');
            if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(() => {
                    glow.style.setProperty('--mx', lastX + 'px');
                    glow.style.setProperty('--my', lastY + 'px');
                    glow.style.background = `radial-gradient(300px circle at ${lastX}px ${lastY}px, var(--accent) 0%, transparent 70%)`;
                    rafPending = false;
                });
            }
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('bento-active');
        });
    });
}

// ========== CIRCULAR GALLERY ==========
function initCircularGallery() {
    const scene=document.getElementById('galleryScene');if(!scene)return;
    const items=scene.querySelectorAll('.gallery-item'),prev=document.getElementById('galleryPrev'),next=document.getElementById('galleryNext'),dotsC=document.getElementById('galleryDots');
    const iT=document.getElementById('galleryInfoTitle'),iD=document.getElementById('galleryInfoDesc'),iY=document.getElementById('galleryInfoYear');
    const total=items.length;let idx=0,busy=false;
    for(let i=0;i<total;i++){const d=document.createElement('button');d.classList.add('gallery-dot');if(i===0)d.classList.add('active');d.addEventListener('click',()=>goTo(i));dotsC.appendChild(d);}
    const dots=dotsC.querySelectorAll('.gallery-dot');
    function getR(){if(window.innerWidth<=480)return 200;if(window.innerWidth<=768)return 280;return 400;}
    function updInfo(){const it=items[idx];iT.textContent=it.dataset.title||'';iD.textContent=it.dataset.desc||'';iY.textContent=it.dataset.year||'';}
    function arrange(){
        const r=getR(),step=(2*Math.PI)/total;
        items.forEach((item,i)=>{let off=i-idx;if(off>total/2)off-=total;if(off<-total/2)off+=total;
        const angle=off*step,x=Math.sin(angle)*r,z=Math.cos(angle)*r-r,abs=Math.abs(off);
        let sc=1,op=1,bl=0;if(abs===0)sc=1.08;else if(abs===1){sc=0.82;op=0.65;bl=1;}else if(abs===2){sc=0.68;op=0.35;bl=2;}else{sc=0.55;op=0.12;bl=3;}
        item.style.transform=`translateX(${x}px) translateZ(${z}px) scale(${sc})`;item.style.opacity=op;item.style.filter=`blur(${bl}px)`;item.style.zIndex=total-abs;item.classList.toggle('active',abs===0);});
        updInfo();
    }
    function goTo(i){if(busy)return;busy=true;idx=((i%total)+total)%total;arrange();dots.forEach((d,j)=>d.classList.toggle('active',j===idx));setTimeout(()=>busy=false,800);}
    prev.addEventListener('click',()=>goTo(idx-1));next.addEventListener('click',()=>goTo(idx+1));
    let tx=0;const gal=document.getElementById('circularGallery');
    gal.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
    gal.addEventListener('touchend',e=>{const d=tx-e.changedTouches[0].clientX;if(Math.abs(d)>50)goTo(d>0?idx+1:idx-1);},{passive:true});
    items.forEach((item,i)=>{item.addEventListener('click',()=>{if(i===idx){const src=item.querySelector('source')?.srcset||item.querySelector('img').src;openLightbox(src);}else goTo(i);});});
    arrange();window.addEventListener('resize',arrange);
}

// ========== LIGHTBOX ==========
let lbOpen=false;
function openLightbox(src){const lb=document.getElementById('lightbox');document.getElementById('lightboxImg').src=src;lb.classList.add('active');document.body.style.overflow='hidden';lbOpen=true;}
function closeLightbox(){document.getElementById('lightbox').classList.remove('active');document.body.style.overflow='';lbOpen=false;}
function initLightbox(){const lb=document.getElementById('lightbox');lb.querySelector('.lightbox-close').addEventListener('click',closeLightbox);lb.addEventListener('click',e=>{if(e.target===lb)closeLightbox();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lbOpen)closeLightbox();});}

