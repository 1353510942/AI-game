export default async function handler(req, res) {

    const API_KEY = process.env.DEEPSEEK_KEY;

    const { type, state } = req.body;

    const s = state || {
        name: "",
        ask: 0,
        hint: 0,
        guess: 0,
        hintLevel: 0,
        difficulty: "easy",
        target: ""
    };

    let prompt = "";

    // =========================
    // 🎯 出题（完全禁止泄露）
    // =========================
    if (type === "generate") {

        let rule = {
            easy: "只选择中小学课本人物，如孔子、秦始皇、牛顿、爱因斯坦、李白",
            hard: "选择大学及扩展历史人物，如帖木儿、阿克巴大帝、查理曼、穆罕默德二世",
            hell: "选择极冷门历史人物，如古埃及法老、小国君主、波斯天文学家"
        }[s.difficulty];

        prompt = `
你是出题AI。

🚨禁止：
- 人物姓名
- 英文
- 年份
- 国家+事件组合
- 可搜索唯一信息

只输出：
【身份标签】

例如：
古代科学家 / 帝国统治者 / 军事统帅 / 思想家

难度：${rule}
`;
    }

    // =========================
    // ❓ 问答系统（封锁）
    // =========================
    if (type === "ask") {

        prompt = `
你是裁判AI。

只能回答：
✔ 是
✔ 否
✔ 部分正确
✔ 无法确定

禁止泄露任何历史信息。

问题：${s.question}
`;
    }

    // =========================
    // 💡 递进提示（核心）
    // =========================
    if (type === "hint") {

        let level = s.hintLevel;

        let hintPrompt = "";

        if (level === 0) {
            hintPrompt = "只给领域和时代，不准给身份";
        }
        if (level === 1) {
            hintPrompt = "可给职业+地区类型，但不能唯一定位";
        }
        if (level >= 2) {
            hintPrompt = "可给身份类型+贡献，但不能给名字";
        }

        prompt = `
你是提示系统。

规则：
- 禁止姓名
- 禁止英文
- 禁止唯一信息

要求：
${hintPrompt}

目标人物：${s.target}
`;
    }

    // =========================
    // 🏁 结算 + 评分 + 百科
    // =========================
    if (type === "end") {

        const score =
            120
            - s.ask * 5
            - s.hint * 12
            - s.guess * 3;

        const wiki = `https://zh.wikipedia.org/wiki/${encodeURIComponent(s.target)}`;
        const baidu = `https://baike.baidu.com/item/${encodeURIComponent(s.target)}`;

        prompt = `
你是结算系统。

必须输出：

1. 中文人物生平（不能英文）
2. 300字以内
3. 通俗易懂
4. 不确定可说明“可能对应多个人物”

最后输出：
评分：${score}

禁止英文
`;
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8
        })
    });

    const data = await response.json();

    res.json({
        result: data.choices?.[0]?.message?.content || "error"
    });
}