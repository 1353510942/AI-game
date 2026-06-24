// =============================================
// 🔐 Supabase 配置
// 替换下面两行为你的 Supabase 项目信息
// Supabase → Settings → API 中找到
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

    document.getElementById("difficultyBox").style.display = "none";
    document.getElementById("gameBox").style.display = "block";
    document.getElementById("gameStatus").innerText = "游戏中...";

    clearChat();
    addChat("🎮 系统：正在选择人物，请稍候...");

    const res = await callAPI({ type: "start", difficulty });

    try {
        const data = JSON.parse(res);
        character = data.name;
        addChat("🎮 游戏开始！难度：" + difficultyLabel(difficulty));
        addChat("💬 请开始提问，或点击【提示】获得线索");
    } catch (e) {
        character = res.trim();
        addChat("🎮 游戏开始！难度：" + difficultyLabel(difficulty));
    }

    logToSupabase("start", difficulty);
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

    const res = await callAPI({ type: "ask", character, question: q });
    addChat("🤖 AI：" + res);
}

// =============================================
// 💡 提示（递进）
// =============================================
async function hint() {
    if (!gameActive) return;

    stats.hint++;
    addChat("💡 请求第 " + (hintLevel + 1) + " 级提示...");

    const res = await callAPI({ type: "hint", character, hintLevel });
    addChat("💡 提示：" + res);

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

    if (g === character) {
        addChat("🎉 恭喜你猜对了！正在生成结算...");
        gameActive = false;
        logToSupabase("win", character);
        await showResult(false);
    } else {
        addChat("❌ 猜错了，再试试！");
    }
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
    addChat("📊 正在生成人物介绍和评分...");

    const res = await callAPI({
        type: "end",
        character,
        difficulty,
        stats
    });

    // 把结果按行展示（支持百科链接格式化）
    const lines = res.split("\n");
    lines.forEach(line => {
        if (line.trim()) {
            if (line.includes("Wikipedia：") || line.includes("百度百科：")) {
                // 链接行变成可点击链接
                const parts = line.split("：");
                if (parts.length >= 2) {
                    const label = parts[0].trim();
                    const url = parts.slice(1).join("：").trim();
                    const div = document.createElement("div");
                    div.innerHTML = label + "：<a href='" + url + "' target='_blank'>" + url + "</a>";
                    document.getElementById("chat").appendChild(div);
                }
            } else {
                addChat(line);
            }
        }
    });

    // 重新开始按钮
    document.getElementById("gameStatus").innerText = "游戏结束";
    addChat("─────────────────────");
    addChat("🔄 点击下方按钮重新开始");
    document.getElementById("restartBtn").style.display = "inline-block";
}

// =============================================
// 🔄 重新开始
// =============================================
function restart() {
    character = "";
    hintLevel = 0;
    stats = { ask: 0, hint: 0, guess: 0 };
    gameActive = false;
    clearChat();
    document.getElementById("restartBtn").style.display = "none";
    document.getElementById("gameBox").style.display = "none";
    document.getElementById("difficultyBox").style.display = "block";
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
    document.getElementById("chat").appendChild(div);
    document.getElementById("chat").scrollTop = 9999;
}

function clearChat() {
    document.getElementById("chat").innerHTML = "";
}

function difficultyLabel(d) {
    return { easy: "简单", hard: "困难", hell: "地狱" }[d] || d;
}