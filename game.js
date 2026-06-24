let username = "";
let mode = "";
let answer = "";

// ======================
// 🔐 Supabase配置（替换这里）
// ======================
const SUPABASE_URL = "https://xddrgmvrcldfnodylwip.supabase.co";
const SUPABASE_KEY = "sb_publishable_WLLFrWKugeSBaViGn4OkPQ_Dmp6Zn1z";

// ======================
// 🚀 DeepSeek后端（注意：不是API KEY）
// ======================
const API_URL = "/api/deepseek";

// ======================

function login() {
    username = document.getElementById("username").value;
    if (!username) return alert("请输入名字");

    document.getElementById("userShow").innerText = username;
    document.getElementById("modeBox").style.display = "block";

    logToSupabase("login", "null");
}

function setMode(m) {
    mode = m;
    document.getElementById("gameBox").style.display = "block";
    startGame();
}

async function startGame() {
    addChat("AI正在选择人物...");

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "choose",
            mode: mode
        })
    });

    const data = await res.json();
    answer = data.result;

    addChat("游戏开始！");
}

async function ask() {
    let q = document.getElementById("question").value;

    const res = await fetch(API_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "ask",
            data: answer,
            mode: q
        })
    });

    const data = await res.json();
    addChat("AI: " + data.result);
}

async function hint() {
    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            type: "hint",
            data: answer
        }),
        headers: {"Content-Type": "application/json"}
    });

    const data = await res.json();
    addChat("💡提示：" + data.result);
}

function giveUp() {
    addChat("你放弃了本局游戏");
    logToSupabase("giveup", answer);
}

async function guess() {
    let g = document.getElementById("guess").value;

    if (g === answer) {
        addChat("🎉 正确！");
        logToSupabase("win", answer);
    } else {
        addChat("❌ 错误");
    }
}

function addChat(msg) {
    let div = document.createElement("div");
    div.innerText = msg;
    document.getElementById("chat").appendChild(div);
}

// ======================
// 📊 Supabase记录
// ======================
async function logToSupabase(mode, result) {
    await fetch(SUPABASE_URL + "/rest/v1/players", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": "Bearer " + SUPABASE_KEY
        },
        body: JSON.stringify({
            name: username,
            mode: mode,
            result: result
        })
    });
}