let state = {
    name: "",
    difficulty: "",
    ask: 0,
    hint: 0,
    guess: 0,
    hintLevel: 0,
    target: ""
};

// =========================
// 👤 设置用户名
// =========================
function setName() {
    state.name = document.getElementById("name").value;
}

// =========================
// 🎮 选择难度
// =========================
function setDifficulty(d) {
    state.difficulty = d;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "generate",
            state
        })
    })
    .then(r => r.json())
    .then(res => {
        state.target = res.result;
        log("游戏开始！");
    });
}

// =========================
// ❓ 提问
// =========================
function ask(q) {

    state.ask++;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "ask",
            state: {...state, question: q}
        })
    })
    .then(r => r.json())
    .then(res => log("AI：" + res.result));
}

// =========================
// 💡 提示
// =========================
function hint() {

    state.hint++;
    state.hintLevel++;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "hint",
            state
        })
    })
    .then(r => r.json())
    .then(res => log("提示：" + res.result));
}

// =========================
// 🎯 猜测
// =========================
function guess(g) {

    state.guess++;

    if (g === state.target) {
        log("🎉 正确！");
    } else {
        log("❌ 错误");
    }
}

// =========================
// 🏁 结束
// =========================
function end() {

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "end",
            state
        })
    })
    .then(r => r.json())
    .then(res => log(res.result));
}

function log(t) {
    document.getElementById("log").innerText += "\n" + t;
}