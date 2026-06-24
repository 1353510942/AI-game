// =============================================
// 🔐 Supabase 配置
// Supabase → Settings → API 中替换以下两行
// =============================================
const SUPABASE_URL = "https://xddrgmvrcldfnodylwip.supabase.co";
const SUPABASE_KEY = "sb_publishable_WLLFrWKugeSBaViGn4OkPQ_Dmp6Zn1z";

// =============================================
// 游戏状态
// =============================================
let username = "";
let character = "";
let difficulty = "";
let hintLevel = 0;
let stats = { ask: 0, hint: 0, guess: 0 };
let gameActive = false;

// 累计总分（跨局保留）
let totalScore = 0;
let roundCount = 0;

// =============================================
// 👤 登录
// =============================================
function login() {
    const val = document.getElementById("username").value.trim();
    if (!val) {
        alert("请输入用户名");
        return;
    }
    username = val;
    document.getElementById("welcomeText").innerText = "欢迎你：" + username;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("difficultyBox").style.display = "block";
    logToSupabase("login", "-");
}

// =============================================
// 🎮 选择难度，开始游戏
// =============================================
async function startGame(d) {
    difficulty = d;
    hintLevel = 0;
    stats = { ask: 0, hint: 0, guess: 0 };
    gameActive = true;
    roundCount++;

    document.getElementById("difficultyBox").style.display = "none";
    document.getElementById("gameBox").style.display = "block";
    document.getElementById("gameStatus").innerText = "游戏中...";

    // 隐藏所有结算按钮
    document.getElementById("continueBtn").style.display = "none";
    document.getElementById("changeDiffBtn").style.display = "none";

    // 更新总分显示
    updateScoreDisplay();

    clearChat();
    addChat("🎮 系统：正在选择人物，请稍候...");

    const res = await callAPI({ type: "start", difficulty });

    // 解析人物名称
    character = parseCharacterName(res);

    removeLastChat();
    addChat("🎮 第 " + roundCount + " 局开始！难度：" + difficultyLabel(difficulty));
    addChat("💬 请开始提问，或点击【提示】获得线索");
    addChat("📌 提示：每次提问、猜测或使用提示都会影响本局得分");

    logToSupabase("start", difficulty);
}

// =============================================
// 解析AI返回的人物名称（兼容各种格式）
// =============================================
function parseCharacterName(res) {
    // 优先尝试完整JSON解析
    try {
        const data = JSON.parse(res);
        if (data.name) return data.name;
    } catch (e) { /* 继续 */ }

    // 尝试从文本中提取JSON片段
    const match = res.match(/\{[\s\S]*?\}/);
    if (match) {
        try {
            const data = JSON.parse(match[0]);
            if (data.name) return data.name;
        } catch (e) { /* 继续 */ }
    }

    // 尝试提取 "name": "xxx" 片段
    const nameMatch = res.match(/"name"\s*:\s*"([^"]+)"/);
    if (nameMatch) return nameMatch[1];

    // 最后兜底：直接用原文
    return res.trim();
}

// =============================================
// 更新总分显示
// =============================================
function updateScoreDisplay() {
    const el = document.getElementById("totalScoreDisplay");
    if (el) {
        el.innerText = "累计得分：" + totalScore + " 分（共 " + (roundCount - 1) + " 局）";
    }
}

// =============================================
// ❓ 提问
// =============================================
async function ask() {
    if (!gameActive) return;

    const q = document.getElementById("question").value.trim();
    if (!q) return;

    stats.ask++;
    addChat("👤 你问：" + q);
    document.getElementById("question").value = "";

    addChat("🤖 AI 思考中...");
    const res = await callAPI({ type: "ask", character, question: q });
    removeLastChat();
    addChat("🤖 AI：" + res);
}

// =============================================
// 💡 提示（递进）
// =============================================
async function hint() {
    if (!gameActive) return;

    stats.hint++;
    addChat("💡 正在获取第 " + (hintLevel + 1) + " 级提示...");

    const res = await callAPI({ type: "hint", character, hintLevel });
    removeLastChat();
    addChat("💡 提示 " + (hintLevel + 1) + "：" + res);

    hintLevel++;
}

// =============================================
// 🎯 猜测
// =============================================
async function guess() {
    if (!gameActive) return;

    const g = document.getElementById("guess").value.trim();
    if (!g) return;

    stats.guess++;
    document.getElementById("guess").value = "";
    addChat("👤 猜测：" + g);

    const isCorrect = checkGuess(g, character);

    if (isCorrect) {
        addChat("🎉 恭喜你猜对了！正在生成结算...");
        gameActive = false;
        logToSupabase("win", character);
        await showResult(false);
    } else {
        addChat("❌ 猜错了，再试试！（提示：请使用该人物最常见的中文名称）");
    }
}

// =============================================
// 猜测匹配（支持简繁体、大小写、包含关系）
// =============================================
function checkGuess(input, answer) {
    const normalize = (s) => s.replace(/\s/g, "").toLowerCase();
    const a = normalize(input);
    const b = normalize(answer);
    return a === b || b.includes(a) || a.includes(b);
}

// =============================================
// 🏳️ 放弃
// =============================================
async function giveUp() {
    if (!gameActive) return;

    gameActive = false;
    addChat("⚠️ 你选择了放弃本局游戏");
    addChat("📖 正确答案是：" + character);
    logToSupabase("giveup", character);
    await showResult(true);
}

// =============================================
// 🏁 结算（胜利或放弃都调用）
// =============================================
async function showResult(isGiveUp) {
    addChat("📊 正在生成人物介绍和评分，请稍候...");

    const res = await callAPI({
        type: "end",
        character,
        difficulty,
        stats
    });

    removeLastChat();

    // 计算本局得分（和后端逻辑保持一致）
    let baseScore = 100;
    if (difficulty === "hard") baseScore = 150;
    if (difficulty === "hell") baseScore = 200;
    const deduction = (stats.ask * 5) + (stats.hint * 10) + (stats.guess * 8);
    const roundScore = isGiveUp ? 0 : Math.max(0, baseScore - deduction);

    // 放弃得0分，胜利才累加
    totalScore += roundScore;

    addChat("─────────────────────");

    // 渲染AI返回的文字内容（不包含链接，链接由前端生成）
    const lines = res.split("\n");
    lines.forEach(line => {
        if (line.trim()) addChat(line);
    });

    addChat("─────────────────────");

    // ✅ 链接完全由前端生成，不依赖AI输出，100%可靠
    const wikiUrl = "https://zh.wikipedia.org/wiki/" + encodeURIComponent(character);
    const baiduUrl = "https://baike.baidu.com/item/" + encodeURIComponent(character);

    addLink("📖 Wikipedia（需要梯子）", wikiUrl);
    addLink("📖 百度百科", baiduUrl);

    addChat("─────────────────────");
    addChat("🏆 本局得分：" + roundScore + " 分" + (isGiveUp ? "（放弃不得分）" : ""));
    addChat("📊 累计总分：" + totalScore + " 分（共 " + roundCount + " 局）");

    document.getElementById("gameStatus").innerText = "游戏结束";

    // 显示两个按钮
    document.getElementById("continueBtn").style.display = "inline-block";
    document.getElementById("changeDiffBtn").style.display = "inline-block";

    updateScoreDisplay();
}

// =============================================
// 添加可点击链接到聊天区
// =============================================
function addLink(label, url) {
    const div = document.createElement("div");
    div.style.margin = "4px 0";
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.color = "#4fc3f7";
    a.style.textDecoration = "underline";
    a.innerText = label + "：" + url;
    div.appendChild(a);
    document.getElementById("chat").appendChild(div);
    document.getElementById("chat").scrollTop = 9999;
}

// =============================================
// 🔄 继续答题（同难度，分数累加）
// =============================================
function continueGame() {
    document.getElementById("continueBtn").style.display = "none";
    document.getElementById("changeDiffBtn").style.display = "none";
    // 直接用当前难度重新开一局
    startGame(difficulty);
}

// =============================================
// 🔄 换个难度（回到难度选择，分数保留）
// =============================================
function changeDifficulty() {
    character = "";
    hintLevel = 0;
    stats = { ask: 0, hint: 0, guess: 0 };
    gameActive = false;

    document.getElementById("continueBtn").style.display = "none";
    document.getElementById("changeDiffBtn").style.display = "none";
    document.getElementById("gameBox").style.display = "none";
    document.getElementById("difficultyBox").style.display = "block";

    // 更新难度选择页面的分数显示
    updateScoreDisplay();
}

// =============================================
// 📡 统一API调用
// =============================================
async function callAPI(body) {
    try {
        const res = await fetch("/api/deepseek", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        return data.result || "未返回内容";
    } catch (err) {
        return "网络错误：" + err.message;
    }
}

// =============================================
// 📊 Supabase 记录
// =============================================
async function logToSupabase(action, value) {
    try {
        await fetch(SUPABASE_URL + "/rest/v1/players", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY,
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                name: username,
                mode: action,
                result: value
            })
        });
    } catch (e) {
        console.log("Supabase记录失败", e);
    }
}

// =============================================
// 🛠️ 工具函数
// =============================================
function addChat(text) {
    const div = document.createElement("div");
    div.innerText = text;
    div.style.margin = "4px 0";
    document.getElementById("chat").appendChild(div);
    document.getElementById("chat").scrollTop = 9999;
}

function removeLastChat() {
    const chat = document.getElementById("chat");
    if (chat.lastChild) chat.removeChild(chat.lastChild);
}

function clearChat() {
    document.getElementById("chat").innerHTML = "";
}

function difficultyLabel(d) {
    return { easy: "简单", hard: "困难", hell: "地狱" }[d] || d;
}

// =============================================
// ⌨️ 回车键支持
// =============================================
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("question")?.addEventListener("keydown", e => {
        if (e.key === "Enter") ask();
    });
    document.getElementById("guess")?.addEventListener("keydown", e => {
        if (e.key === "Enter") guess();
    });
    document.getElementById("username")?.addEventListener("keydown", e => {
        if (e.key === "Enter") login();
    });
});