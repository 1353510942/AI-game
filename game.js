let state = {
    difficulty: "easy",
    ask: 0,
    hint: 0,
    guess: 0,
    target: ""
};

// =========================
// 💡 提示系统
// =========================
function getHint() {

    state.hint++;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "hint",
            state
        })
    })
    .then(r => r.json())
    .then(res => {
        document.getElementById("log").innerHTML +=
            "\n💡提示：" + res.result + "\n";
    });
}

// =========================
// ❓提问
// =========================
function askQuestion(q) {

    state.ask++;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "ask",
            state: { ...state, question: q }
        })
    })
    .then(r => r.json())
    .then(res => {
        document.getElementById("log").innerHTML +=
            "\n❓回答：" + res.result + "\n";
    });
}

// =========================
// 🏁 结算（重点：百科修复）
// =========================
function endGame() {

    state.guess++;

    fetch("/api/deepseek", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            type: "end",
            state
        })
    })
    .then(r => r.json())
    .then(res => {

        const wiki = "https://zh.wikipedia.org/wiki/" + encodeURIComponent(state.target);
        const baidu = "https://baike.baidu.com/item/" + encodeURIComponent(state.target);

        document.getElementById("log").innerHTML +=
            "\n\n🏁结算结果：\n" +
            res.result +
            "\n\n📚 Wikipedia：" + wiki +
            "\n📘 百度百科：" + baidu;
    });
}