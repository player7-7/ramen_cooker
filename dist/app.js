const TOPPINGS = ["계란", "치즈", "만두", "공기밥"];
const SPICE_LEVELS = ["덜매운", "보통맛", "매운"];
const TEXTURES = ["꼬들한", "보통", "퍼진"];
const NOODLES = ["밀면", "쌀면"];
const SPICE_REQUESTS = ["안맵게", "보통", "맵게"];
const BROTH_REQUESTS = ["국물 적게", "국물 보통", "국물 많이"];
const CUSTOMERS = [
  { name: "민지", image: "./assets/customer_1.png" },
  { name: "태호", image: "./assets/customer_2.png" },
  { name: "수아", image: "./assets/customer_3.png" },
  { name: "준", image: "./assets/customer_4.png" },
];

const ramenPreview = document.getElementById("ramenPreview");
const orderText = document.getElementById("orderText");
const toppingOrderText = document.getElementById("toppingOrderText");
const statusText = document.getElementById("statusText");
const dropHint = document.getElementById("dropHint");
const customerImage = document.getElementById("customerImage");
const customerName = document.getElementById("customerName");
const potZone = document.querySelector(".pot-zone");

const spiceButtons = document.getElementById("spiceButtons");
const textureButtons = document.getElementById("textureButtons");
const noodleButtons = document.getElementById("noodleButtons");
const toolItems = document.getElementById("toolItems");

const startBtn = document.getElementById("startBtn");
const fireBtn = document.getElementById("fireBtn");
const serveBtn = document.getElementById("serveBtn");
const stepList = document.getElementById("stepList");

let imageCache = new Map();
let isCooked = false;
let customerOrder = makeRandomOrder();
let selectedProfile = {
  spice: SPICE_LEVELS[1],
  texture: TEXTURES[1],
  noodle: NOODLES[0],
};
let process = {
  water: false,
  fire: false,
  soup: false,
  noodle: false,
};
let waterAmount = 0;
let soupAmount = 0;
let toppings = new Set();

renderAll();

startBtn.addEventListener("click", startNewOrder);
fireBtn.addEventListener("click", turnOnFire);
serveBtn.addEventListener("click", serveRamen);

potZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  potZone.classList.add("drag-over");
});

potZone.addEventListener("dragleave", () => {
  potZone.classList.remove("drag-over");
});

potZone.addEventListener("drop", (event) => {
  event.preventDefault();
  potZone.classList.remove("drag-over");
  const key = event.dataTransfer.getData("text/plain");
  if (!key) return;
  handleDropAction(key);
});

function renderAll() {
  renderOrderInfo();
  renderChoiceButtons();
  renderTools();
  renderStepList();
  updateButtons();
  updateHints();
  updatePreview();
}

function startNewOrder() {
  isCooked = false;
  process = { water: false, fire: false, soup: false, noodle: false };
  waterAmount = 0;
  soupAmount = 0;
  toppings.clear();
  customerOrder = makeRandomOrder();
  selectedProfile = { spice: SPICE_LEVELS[1], texture: TEXTURES[1], noodle: NOODLES[0] };
  statusText.textContent = "새 주문 접수! 물 페트병을 냄비에 드래그해 시작하세요.";
  renderAll();
}

function turnOnFire() {
  if (isCooked) return;
  if (!process.water) {
    statusText.textContent = "먼저 물부터 넣어주세요.";
    return;
  }
  if (process.fire) {
    statusText.textContent = "이미 불이 켜져 있어요.";
    return;
  }
  process.fire = true;
  statusText.textContent = "불을 켰어요. 이제 스프를 넣어주세요.";
  renderStepList();
  updateButtons();
  updateHints();
  updatePreview();
}

function serveRamen() {
  if (!process.noodle) {
    statusText.textContent = "아직 면이 안 들어갔어요. 순서대로 진행해 주세요.";
    return;
  }

  isCooked = true;
  const mismatch = getOrderMismatch();
  const toppingText = toppings.size ? `넣은 토핑: ${[...toppings].join(", ")}` : "넣은 토핑 없음";
  if (mismatch.length === 0) {
    statusText.textContent = `주문 성공! ${customerOrder.customer.name} 손님이 만족했어요. (${toppingText})`;
  } else {
    statusText.textContent = `주문과 다름: ${mismatch.join(", ")}. (${toppingText})`;
  }
  renderStepList();
  updateButtons();
  updateHints();
  updatePreview();
}

function handleDropAction(key) {
  if (isCooked) return;

  if (key === "water") {
    if (waterAmount >= 3) {
      statusText.textContent = "물은 최대치예요.";
      return;
    }
    waterAmount += 1;
    process.water = waterAmount > 0;
    selectedProfile.spice = getSpiceFromAmounts();
    statusText.textContent = `물을 부었어요. 현재 물 양: ${waterAmount}/3`;
    renderStepList();
    updateButtons();
    renderChoiceButtons();
    updateHints();
    updatePreview();
    return;
  }

  if (key === "soup") {
    if (!process.water || !process.fire) {
      statusText.textContent = "물 넣고 불을 켠 다음 스프를 넣어주세요.";
      return;
    }
    if (soupAmount >= 3) {
      statusText.textContent = "스프는 최대치예요.";
      return;
    }
    soupAmount += 1;
    process.soup = soupAmount > 0;
    selectedProfile.spice = getSpiceFromAmounts();
    statusText.textContent = `스프를 넣었어요. 현재 스프 양: ${soupAmount}/3`;
    renderStepList();
    updateButtons();
    renderChoiceButtons();
    updateHints();
    updatePreview();
    return;
  }

  if (key === "noodle") {
    if (!process.soup) {
      statusText.textContent = "스프를 먼저 넣어주세요.";
      return;
    }
    if (process.noodle) {
      statusText.textContent = "면은 이미 넣었어요.";
      return;
    }
    process.noodle = true;
    statusText.textContent = "면을 넣었어요. 이제 원하는 토핑을 드래그해 넣고 서빙하세요.";
    renderStepList();
    updateButtons();
    updateHints();
    updatePreview();
    return;
  }

  if (key.startsWith("topping:")) {
    if (!process.noodle) {
      statusText.textContent = "면을 먼저 넣어야 토핑을 올릴 수 있어요.";
      return;
    }
    const topping = key.split(":")[1];
    toppings.add(topping);
    statusText.textContent = `${topping} 토핑을 넣었어요. 더 넣거나 완성 서빙을 누르세요.`;
    renderStepList();
    updateHints();
    updatePreview();
  }
}

function renderOrderInfo() {
  orderText.textContent = `손님 주문: ${customerOrder.brothRequest}, ${customerOrder.spiceRequest}, ${customerOrder.texture} ${customerOrder.noodle} 라면`;
  toppingOrderText.textContent = `원하는 토핑: ${customerOrder.toppings.join(", ")}`;
  customerImage.src = customerOrder.customer.image;
  customerImage.alt = `${customerOrder.customer.name} 손님 이미지`;
  customerName.textContent = `${customerOrder.customer.name} 손님`;
}

function renderChoiceButtons() {
  renderSpiceAutoButtons();
  renderChoiceGroup(textureButtons, TEXTURES, selectedProfile.texture, (value) => {
    if (isCooked) return;
    selectedProfile.texture = value;
    updatePreview();
  });
  renderChoiceGroup(noodleButtons, NOODLES, selectedProfile.noodle, (value) => {
    if (isCooked) return;
    selectedProfile.noodle = value;
    updatePreview();
  });
}

function renderSpiceAutoButtons() {
  spiceButtons.innerHTML = "";
  SPICE_LEVELS.forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = value;
    if (value === selectedProfile.spice) btn.classList.add("active");
    btn.disabled = true;
    spiceButtons.append(btn);
  });
}

function renderChoiceGroup(container, options, activeValue, onClick) {
  container.innerHTML = "";
  options.forEach((value) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = value;
    if (value === activeValue) btn.classList.add("active");
    btn.disabled = isCooked;
    btn.addEventListener("click", () => {
      onClick(value);
      renderChoiceButtons();
    });
    container.append(btn);
  });
}

function renderTools() {
  toolItems.innerHTML = "";
  const toppingEmoji = {
    계란: "🥚",
    치즈: "🧀",
    만두: "🥟",
    공기밥: "🍚",
  };
  const tools = [
    { key: "water", emoji: "🧴", label: `물 페트병 ${waterAmount}/3`, locked: isCooked || process.noodle || waterAmount >= 3 },
    { key: "soup", emoji: "🧂", label: `스프 ${soupAmount}/3`, locked: isCooked || !process.water || !process.fire || process.noodle || soupAmount >= 3 },
    { key: "noodle", emoji: "🍜", label: "면", locked: isCooked || !process.soup || process.noodle },
    ...TOPPINGS.map((name) => ({
      key: `topping:${name}`,
      emoji: toppingEmoji[name],
      label: name,
      locked: isCooked || !process.noodle,
    })),
  ];

  tools.forEach((tool) => {
    const item = document.createElement("div");
    item.className = "tool-item";
    if (tool.locked) item.classList.add("locked");
    item.draggable = !tool.locked;
    item.dataset.key = tool.key;

    const emoji = document.createElement("span");
    emoji.className = "tool-emoji";
    emoji.textContent = tool.emoji;

    const label = document.createElement("span");
    label.className = "tool-label";
    label.textContent = tool.label;

    item.append(emoji, label);
    item.addEventListener("dragstart", (event) => {
      if (tool.locked) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData("text/plain", tool.key);
    });

    toolItems.append(item);
  });
}

function renderStepList() {
  const steps = [
    { label: `물 붓기 (${waterAmount}/3)`, done: process.water },
    { label: "불 켜기", done: process.fire },
    { label: `스프 넣기 (${soupAmount}/3)`, done: process.soup },
    { label: "면 넣기", done: process.noodle },
    { label: "토핑 넣기", done: toppings.size > 0 },
    { label: "서빙 완료", done: isCooked },
  ];

  stepList.innerHTML = "";
  steps.forEach((step, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${step.label}`;
    if (step.done) li.className = "done";
    stepList.append(li);
  });
}

function updateButtons() {
  fireBtn.disabled = isCooked || process.fire || !process.water;
  serveBtn.disabled = isCooked || !process.noodle;
  renderTools();
}

function updateHints() {
  if (isCooked) {
    dropHint.textContent = "서빙이 완료됐어요. 새 주문 받기로 다시 시작하세요.";
    return;
  }
  if (!process.water) {
    dropHint.textContent = "물 페트병을 냄비로 드래그하세요.";
    return;
  }
  if (!process.fire) {
    dropHint.textContent = "냄비 오른쪽 버튼으로 불을 켜주세요.";
    return;
  }
  if (!process.soup) {
    dropHint.textContent = "스프를 냄비로 드래그하세요.";
    return;
  }
  if (!process.noodle) {
    dropHint.textContent = "스프/물 양으로 맵기 조절 후 면을 드래그하세요.";
    return;
  }
  dropHint.textContent = "토핑을 냄비로 드래그한 뒤 완성 서빙을 누르세요.";
}

function getOrderMismatch() {
  const issues = [];
  if (!matchesSpiceRequest(selectedProfile.spice, customerOrder.spiceRequest)) {
    issues.push(`맵기 ${customerOrder.spiceRequest}`);
  }
  if (!matchesBrothRequest(waterAmount, customerOrder.brothRequest)) {
    issues.push(`${customerOrder.brothRequest}`);
  }
  if (selectedProfile.texture !== customerOrder.texture) issues.push(`면 익힘 ${customerOrder.texture}`);
  if (selectedProfile.noodle !== customerOrder.noodle) issues.push(`면 종류 ${customerOrder.noodle}`);

  const requested = customerOrder.toppings;
  const selected = [...toppings];
  const missing = requested.filter((item) => !toppings.has(item));
  const extra = selected.filter((item) => !requested.includes(item));
  if (missing.length) issues.push(`필수 토핑 ${missing.join(", ")}`);
  if (extra.length) issues.push(`빼야 할 토핑 ${extra.join(", ")}`);
  return issues;
}

function updatePreview() {
  const key = `${process.water ? 1 : 0}-${process.fire ? 1 : 0}-${process.soup ? 1 : 0}-${process.noodle ? 1 : 0}-${getToppingMask()}-${selectedProfile.spice}-${selectedProfile.texture}-${selectedProfile.noodle}-${isCooked ? 1 : 0}`;
  if (!imageCache.has(key)) {
    imageCache.set(key, drawRamenImage(process, toppings, selectedProfile, isCooked));
  }
  ramenPreview.src = imageCache.get(key);
}

function getToppingMask() {
  let mask = 0;
  TOPPINGS.forEach((name, index) => {
    if (toppings.has(name)) mask |= 1 << index;
  });
  return mask;
}

function makeRandomOrder() {
  const shuffled = [...TOPPINGS].sort(() => Math.random() - 0.5);
  const brothRequest = pickOne(BROTH_REQUESTS);
  let spiceRequest = pickOne(SPICE_REQUESTS);
  if (brothRequest === "국물 많이" && spiceRequest === "맵게") {
    spiceRequest = pickOne(["안맵게", "보통"]);
  }
  return {
    customer: pickOne(CUSTOMERS),
    spiceRequest,
    brothRequest,
    texture: pickOne(TEXTURES),
    noodle: pickOne(NOODLES),
    toppings: shuffled.slice(0, 1 + Math.floor(Math.random() * 3)),
  };
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getSpiceFromAmounts() {
  const delta = soupAmount - waterAmount;
  if (delta <= -1) return "덜매운";
  if (delta >= 1) return "매운";
  return "보통맛";
}

function matchesSpiceRequest(actualSpice, request) {
  if (request === "안맵게") return actualSpice === "덜매운";
  if (request === "맵게") return actualSpice === "매운";
  return actualSpice === "보통맛";
}

function matchesBrothRequest(water, request) {
  if (request === "국물 많이") return water >= 3;
  if (request === "국물 적게") return water <= 1;
  return water === 2;
}

function drawRamenImage(proc, toppingSet, profile, cooked) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const back = ctx.createLinearGradient(0, 0, 0, size);
  back.addColorStop(0, "#edf2f7");
  back.addColorStop(1, "#d7e0eb");
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, size, size);

  if (proc.fire) {
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(220, 390);
    ctx.lineTo(240, 430);
    ctx.lineTo(260, 390);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(260, 390);
    ctx.lineTo(282, 432);
    ctx.lineTo(304, 390);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = proc.fire ? "#4b5563" : "#6b7280";
  fillRoundRect(ctx, 90, 140, 332, 250, 36);
  ctx.fillStyle = "#111827";
  ctx.fillRect(58, 228, 34, 70);
  ctx.fillRect(422, 228, 34, 70);

  if (proc.water) {
    ctx.fillStyle = proc.soup ? getBrothColor(profile.spice) : "#93c5fd";
    ctx.beginPath();
    ctx.ellipse(256, 258, 140, 80, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (proc.noodle) {
    drawNoodles(ctx, profile.texture, profile.noodle);
  }

  if (proc.noodle) {
    drawToppings(ctx, toppingSet);
  }

  if (proc.fire && !cooked) {
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(210, 120, 24, 0.2, 2.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(280, 104, 28, 0.2, 2.7);
    ctx.stroke();
  }

  if (cooked) {
    ctx.fillStyle = "rgba(22, 163, 74, 0.9)";
    ctx.fillRect(20, 20, 220, 44);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 22px sans-serif";
    ctx.fillText("서빙 완료!", 58, 49);
  }

  return canvas.toDataURL("image/png");
}

function getBrothColor(spice) {
  if (spice === "덜매운") return "#fb923c";
  if (spice === "보통맛") return "#ea580c";
  return "#b91c1c";
}

function drawNoodles(ctx, texture, noodleType) {
  const thickness = texture === "꼬들한" ? 4 : texture === "보통" ? 6 : 8;
  const color = noodleType === "밀면" ? "#fbbf24" : "#f8fafc";
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.arc(160 + i * 18, 254 + (i % 3) * 8, 26, 0.3, 2.8);
    ctx.stroke();
  }
}

function drawToppings(ctx, toppingSet) {
  if (toppingSet.has("계란")) {
    ctx.fillStyle = "#fff7d6";
    ctx.beginPath();
    ctx.arc(200, 255, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(200, 255, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  if (toppingSet.has("치즈")) {
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.moveTo(305, 220);
    ctx.lineTo(362, 252);
    ctx.lineTo(315, 290);
    ctx.closePath();
    ctx.fill();
  }
  if (toppingSet.has("만두")) {
    ctx.fillStyle = "#f3e8d0";
    ctx.beginPath();
    ctx.ellipse(272, 285, 24, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(332, 280, 24, 14, -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  if (toppingSet.has("공기밥")) {
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(248, 298, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(248, 298, 20, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fillRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}
