module.exports = async (req, res) => {

    const { type, mode, data } = req.body;

    const API_KEY = process.env.DEEPSEEK_KEY;

    let prompt = "";

    if (type === "choose") {

        let difficultyText = "";

        if (mode === "easy") {
            difficultyText = "只选择中小学课本人物，如孔子、秦始皇、牛顿、爱因斯坦、李白";
        }

        if (mode === "hard") {
            difficultyText = "选择大学及扩展历史人物，如帖木儿、阿克巴大帝、查理曼";
        }

        if (mode === "hell") {
            difficultyText = "选择极冷门历史人物，如古埃及法老、小国君主、波斯天文学家";
        }

        prompt = `
你是历史人物生成器。
严格规则：
- 只输出中文人名
- 不解释
- 不输出英文
- 不要标点

难度：${difficultyText}
`;
    }

    if (type === "ask") {
        prompt = `
答案：${data}
问题：${mode}
请只回答：是 / 否 / 不确定
`;
    }

    if (type === "hint") {
        prompt = `
给出该人物一个中文提示（禁止英文）
人物：${data}
`;
    }

    try {
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

        const result = await response.json();

        res.status(200).json({
            result: result.choices?.[0]?.message?.content || "生成失败"
        });

    } catch (err) {
        res.status(500).json({
            result: "AI调用失败"
        });
    }
};