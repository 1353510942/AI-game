export default async function handler(req, res) {

    const API_KEY = process.env.DEEPSEEK_KEY;

    const { type, state } = req.body;

    const s = state || {};

    let prompt = "";

    // =========================
    // 🎯 出题（绝不泄露姓名）
    // =========================
    if (type === "generate") {

        prompt = `
你是历史出题AI。

🚨绝对禁止输出：
- 人名
- 地名组合唯一信息
- 可搜索短句
- 英文
- 年代

🎯输出：
只输出【身份类型 + 职业类别】

例如：
“古代统治者”
“哲学家”
“科学家”
“军事人物”

难度：
${s.difficulty}
`;
    }

    // =========================
    // ❓ 判断问题（稳定）
    // =========================
    if (type === "ask") {

        prompt = `
你是裁判。

只能回答：
是 / 否 / 不确定 / 部分正确

禁止解释
问题：${s.question}
`;
    }

    // =========================
    // 💡 分层提示系统（重点修复）
    // =========================
    if (type === "hint") {

        const level = s.hintLevel || 0;

        let rule = "";

        if (level === 0) {
            rule = "只给：时代 + 领域（禁止国家/名字/事件）";
        } else if (level === 1) {
            rule = "给：职业 + 活动领域（不准具体人物信息）";
        } else {
            rule = "给：核心贡献 + 历史意义（仍禁止名字）";
        }

        prompt = `
你是提示系统。

🚨禁止：
- 古文
- 隐喻
- 人名
- 英文

要求：
一句中文说明

规则：
${rule}

目标人物：${s.target}
`;
    }

    // =========================
    // 🏁 结算（强制百科）
    // =========================
    if (type === "end") {

        const score =
            100
            - (s.ask * 5)
            - (s.hint * 10)
            - (s.guess * 8);

        prompt = `
你是结算系统。

必须输出：

【人物生平】（200字中文）
【历史贡献】
【现实意义】

⚠️禁止英文

最后输出：
评分：${score}
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
            temperature: 0.5
        })
    });

    const data = await response.json();

    res.json({
        result: data.choices?.[0]?.message?.content || "error"
    });
}