export default async function handler(req, res) {
    const { type, mode, data } = req.body;

    const API_KEY = process.env.DEEPSEEK_API_KEY;

    let prompt = "";

    if (type === "choose") {

        let difficultyText = "";

        if (mode === "easy") difficultyText = "人物必须来自中小学历史/语文/数理课本中的常见人物,例如：牛顿、爱因斯坦、孔子、秦始皇、李白";
        if (mode === "hard") difficultyText = "人物必须是大学或扩展知识人物（半知名）,例如：帖木儿、阿克巴大帝、查理曼、奥斯曼帝国早期统治者";
        if (mode === "hell") difficultyText = "人物必须是冷门历史人物（普通人基本不知道）,例如：古埃及小法老、波斯冷门天文学家、印度地方王朝创立者";

        prompt = `
你是一个历史人物生成器。
请严格只输出一个中文人名，不要解释，不要英文。
难度：${difficultyText}
`;
    }

    if (type === "ask") {
        prompt = `
用户正在猜人物：
答案是：${data}
用户问题：${mode}

请用中文回答，只允许是或否或简单提示。
`;
    }

    if (type === "hint") {
        prompt = `
给出该人物一个中文提示，不要英文，不要解释：
人物：${data}
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
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.8
        })
    });

    const result = await response.json();

    res.status(200).json({
        result: result.choices[0].message.content
    });
}