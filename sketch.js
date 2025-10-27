let points = [];
let center = { x: 0, y: 0 };
let rate = 0.1;
let iter = 0;
let f = null;
let animStage = -1;
let canvasW, canvasH;

let minX, maxX, minY, maxY;
let scale = 1;
let offsetX = 0, offsetY = 0;
let margin = 40;

let autoRunning = false;
let autoInterval = null;

let canvas;

function setup() {
	resizeCanvasToWindow();
	resetRandomPoints(15);

	document.getElementById("loadBtn").onclick = loadPoints;
	document.getElementById("randomInputBtn").onclick = generateRandomInput;
	document.getElementById("nextStepBtn").onclick = nextStage;
	document.getElementById("resetBtn").onclick = () => { reset(); };
	document.getElementById("autoBtn").onclick = toggleAutoRun;

	const panel   = document.getElementById("side-panel");
	const overlay = document.getElementById("panel-overlay");
	const closeBtn = document.getElementById("panel-close");

	const togglePanel = (forceOpen = null) => {
		const willOpen = forceOpen === null ? !panel.classList.contains("open") : forceOpen;
		panel.classList.toggle("open", willOpen);
		panel.setAttribute("aria-hidden", String(!willOpen));
		if (overlay) overlay.hidden = !willOpen;
		document.body.classList.toggle("no-scroll", willOpen);
	};

	if (closeBtn) closeBtn.addEventListener("click", () => togglePanel(false));
	if (overlay) overlay.addEventListener("click", () => togglePanel(false), { passive: true });

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && panel.classList.contains("open")) togglePanel(false);
	});

	let touchStartX = null, touchStartY = null, swiping = false;
	panel.addEventListener("touchstart", (e) => {
		if (!panel.classList.contains("open")) return;
		const t = e.changedTouches[0];
		touchStartX = t.clientX;
		touchStartY = t.clientY;
		swiping = true;
	}, { passive: true });

	panel.addEventListener("touchmove", (e) => {
		if (!swiping) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - touchStartX;
		const dy = t.clientY - touchStartY;
		if (Math.abs(dx) > 50 && Math.abs(dy) < 40 && dx < 0) {
			swiping = false;
			togglePanel(false);
		}
	}, { passive: true });

	panel.addEventListener("touchend", () => { swiping = false; }, { passive: true });

	const onPanelClickForTab = (e) => {
		const rect = panel.getBoundingClientRect();
		const rootStyles = getComputedStyle(document.documentElement);
		const tabW = parseInt(rootStyles.getPropertyValue('--tab-w')) || 14;
		const inTabBand = (e.clientX >= rect.right - tabW && e.clientX <= rect.right + tabW);
		if (!inTabBand) return;
		const willOpen = !panel.classList.contains("open");
		togglePanel(willOpen);
		e.stopPropagation();
		e.preventDefault();
	};
	panel.addEventListener('click', onPanelClickForTab, { capture: true });
	panel.addEventListener('touchstart', onPanelClickForTab, { capture: true, passive: true });

	[0, 200, 800].forEach((delay) => setTimeout(resizeCanvasToWindow, delay));
}

function resizeCanvasToWindow() {
	const header = document.querySelector("header");
	const buttons = document.querySelector(".button-group");
	const infoBox = document.getElementById("infoBox");
	const container = document.getElementById("canvas-container");

	const totalH = window.innerHeight;

	const headerH = header ? header.offsetHeight : 0;
	const buttonsH = buttons ? buttons.offsetHeight : 0;
	const infoH = infoBox ? Math.min(infoBox.offsetHeight, 220) : 0;
	const padding = 48;

	const availableH = Math.max(totalH - (headerH + buttonsH + infoH + padding), 220);
	const clampedH = Math.min(availableH, 720);

	container.style.height = `${clampedH}px`;

	const rect = container.getBoundingClientRect();
	canvasW = rect.width;
	canvasH = rect.height;
	if (!canvas) {
		canvas = createCanvas(canvasW, canvasH);
		canvas.parent("canvas-container");
	}
	else resizeCanvas(canvasW, canvasH);
}
function windowResized() { resizeCanvasToWindow(); }

function updateScale() {
	if (points.length === 0) return;
	const xs = points.map(p => p.x);
	const ys = points.map(p => p.y);
	minX = Math.min(...xs);
	maxX = Math.max(...xs);
	minY = Math.min(...ys);
	maxY = Math.max(...ys);

	const rangeX = maxX - minX || 1;
	const rangeY = maxY - minY || 1;
	const scaleX = (width - margin * 2) / rangeX;
	const scaleY = (height - margin * 2) / rangeY;
	scale = min(scaleX, scaleY);

	const midX = (minX + maxX) / 2;
	const midY = (minY + maxY) / 2;
	offsetX = width / 2 - midX * scale;
	offsetY = height / 2 + midY * scale;
}
function mapX(x) { return offsetX + x * scale; }
function mapY(y) { return offsetY - y * scale; }

function draw() {
	background(255);
	if (points.length === 0) return;

	updateScale();

	stroke(0);
	fill(30);
	for (let p of points) circle(mapX(p.x), mapY(p.y), 6);

	stroke(0);
	strokeWeight(1.5);
	fill(255, 80, 80);
	circle(mapX(center.x), mapY(center.y), 10);

	if (!f) f = farPoint();
	stroke(0);
	strokeWeight(1.5);
	fill(80, 120, 255);
	circle(mapX(f.x), mapY(f.y), 10);

	let r = sqrt(distSq(center, f)) * scale;
	noFill();
	stroke(80, 120, 255, 100);
	ellipse(mapX(center.x), mapY(center.y), 2 * r);

	const ax = mapX(center.x);
	const ay = mapY(center.y);
	const fx = mapX(f.x);
	const fy = mapX(f.y) && mapY(f.y); 
	const fy2 = mapY(f.y);

	if (animStage === 0) {
		drawingContext.setLineDash([6, 6]);
		stroke(0, 150, 0);
		strokeWeight(1.5);
		line(ax, ay, mapX(f.x), fy2);
		drawingContext.setLineDash([]);
		noFill();
		stroke(80, 120, 255);
		ellipse(mapX(f.x), fy2, 25);
	}
	else if (animStage === 1) {
		const step = {
			x: center.x + (f.x - center.x) * rate,
			y: center.y + (f.y - center.y) * rate,
		};
		const ex = mapX(step.x);
		const ey = mapY(step.y);

		stroke(0);
		strokeWeight(1.5);
		fill(255, 80, 80);
		circle(ex, ey, 10);

		drawingContext.setLineDash([6, 6]);
		stroke(0, 150, 0);
		strokeWeight(1.5);
		line(ax, ay, ex, ey);
		drawingContext.setLineDash([]);

		drawingContext.setLineDash([6, 6]);
		stroke(0, 150, 0);
		strokeWeight(1.5);
		line(ex, ey, mapX(f.x), fy2);
		drawingContext.setLineDash([]);

		const distSqStep = (ex - ax) ** 2 + (ey - ay) ** 2;
		if (distSqStep > 4) {
			stroke(0, 150, 0);
			strokeWeight(1.5);
			line(ax, ay, ex, ey);
			fill(0, 150, 0);
			noStroke();
			drawArrow(ax, ay, ex, ey);
		}
	}
	else if (animStage === 2) {
		doStep();
		animStage = -1;
	}

	updateInfo(f, r / scale);
}

function nextStage() {
	if (animStage === -1) {
		f = farPoint();
		animStage = 0;
	}
	else if (animStage < 2) animStage++;
		else animStage = -1;
}

function doStep() {
	center.x += (f.x - center.x) * rate;
	center.y += (f.y - center.y) * rate;
	rate *= 0.999;
	++iter;
	f = farPoint();
}

function drawArrow(x1, y1, x2, y2) {
	line(x1, y1, x2, y2);
	const angle = atan2(y2 - y1, x2 - x1);
	const arrowSize = 8;
	push();
	translate(x2, y2);
	rotate(angle);
	triangle(0, 0, -arrowSize, 4, -arrowSize, -4);
	pop();
}

function farPoint() {
	let res = points[0];
	let best = distSq(center, res);
	for (let p of points) {
		let d = distSq(center, p);
		if (d > best) {
			best = d;
			res = p;
		}
	}
	return res;
}

function distSq(a, b) { return (a.x - b.x)**2 + (a.y - b.y)**2; }

function resetRandomPoints(n) {
	points = [];
	let inputText = n + "\n";
	for (let i = 0; i < n; i++) {
		const x = random(-200, 200);
		const y = random(-200, 200);
		points.push({ x, y });
		inputText += `${x.toFixed(1)} ${y.toFixed(1)}\n`;
	}
	const inputBox = document.getElementById("inputBox");
	if (inputBox) inputBox.value = inputText.trim();
	reset();
}

function reset() {
	stopAutoRun();
	if (points.length > 0) {
		const sumX = points.reduce((acc, p) => acc + p.x, 0);
		const sumY = points.reduce((acc, p) => acc + p.y, 0);
		center = { x: sumX / points.length, y: sumY / points.length };
	}
	else center = { x: 0, y: 0 };
	rate = 0.1;
	iter = 0;
	animStage = -1;
	f = null;
}

function loadPoints() {
	const text = document.getElementById("inputBox").value.trim();
	if (text.length === 0) return alert("입력이 비어 있습니다.");
	const lines = text.split("\n");
	const n = parseInt(lines[0]);
	if (isNaN(n) || n <= 0) return alert("첫 줄에 점의 개수를 입력해야 합니다.");
	const newPoints = [];
	for (let i = 1; i <= n; i++) {
		if (!lines[i]) continue;
		const parts = lines[i].trim().split(/\s+/);
		if (parts.length !== 2 || parts.some(v => isNaN(parseFloat(v)))) return alert(`${i}번째 줄의 형식이 잘못되었습니다.`);
		const [x, y] = parts.map(Number);
		newPoints.push({ x, y });
	}
	if (newPoints.length === 0) return alert("유효한 점이 없습니다.");
	points = newPoints;
	stopAutoRun();
	reset();
}

function generateRandomInput() {
	let n = int(random(5, 10));
	let str = n + "\n";
	for (let i = 0; i < n; i++) {
		let x = random(-200, 200);
		let y = random(-200, 200);
		str += `${x.toFixed(1)} ${y.toFixed(1)}\n`;
	}
	document.getElementById("inputBox").value = str.trim();
}

function updateInfo(f, r) {
	const box = document.getElementById("infoBox");
	box.textContent =
`Step : ${iter}
Rate : ${rate.toFixed(5)}
Center : (${center.x.toFixed(2)}, ${center.y.toFixed(2)})
Radius : ${r.toFixed(2)}
Farthest Point : (${f.x.toFixed(2)}, ${f.y.toFixed(2)})`;
}

function startAutoRun() {
	if (autoRunning) return;
	const btn = document.getElementById("autoBtn");
	const nextBtn = document.getElementById("nextStepBtn");
	autoRunning = true;
	btn.textContent = "⏸ 정지";
	nextBtn.disabled = true;
	animStage = -1;
	autoInterval = setInterval(() => {
		if (points.length === 0) return;
		const steps = 9;
		for (let i = 0; i < steps; i++) doStep();
	}, 30);
}

function stopAutoRun() {
	if (autoInterval) clearInterval(autoInterval);
	autoInterval = null;
	autoRunning = false;
	document.getElementById("autoBtn").textContent = "▶ 자동 실행";
	document.getElementById("nextStepBtn").disabled = false;
}

function toggleAutoRun() {
	if (!autoRunning) startAutoRun();
	else stopAutoRun();
}
