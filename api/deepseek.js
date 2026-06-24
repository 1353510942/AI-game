export default async function handler(req, res) {

    // ✅ API KEY 安全存放在 Vercel 环境变量
    // 请在 Vercel → Settings → Environment Variables 中添加：
    // DEEPSEEK_KEY = 你的DeepSeek API Key
    const API_KEY = process.env.DEEPSEEK_KEY;

    if (!API_KEY) {
        return res.status(500).json({ error: "缺少API Key，请检查Vercel环境变量" });
    }

    const { type, difficulty, character, question, hintLevel, stats } = req.body;

    let prompt = "";

    // =========================
    // 🎯 出题系统
    // =========================
    if (type === "start") {

        const easyExamples = "孔子、孟子、李白、杜甫、曹操、诸葛亮、秦始皇、汉武帝、武则天、岳飞、牛顿、爱因斯坦、达芬奇、拿破仑、林肯、华盛顿、马克思、莎士比亚";
        const hardExamples = "帖木儿、阿克巴大帝、查理曼、萨拉丁、忽必烈、苏莱曼大帝、梅赫梅德二世、努尔哈赤、亚历山大大帝、汉尼拔、恺撒、屋大维、伊丽莎白一世、腓特烈大帝";
        const hellExamples = "阿蒙霍特普四世、拉美西斯三世、纳布科多诺索二世、塞琉古一世、米特拉达梯六世、阿育王、旃陀罗笈多、波斯波利斯、苏尔王朝创始人舍尔沙、奥马尔·海亚姆、比鲁尼、花拉子密";

        let pool = "";
        let instruction = "";

        if (difficulty === "easy") {
            pool = easyExamples;
            instruction = "从以上人物或同等知名度的中小学课本人物中，随机选一个，不要总选同一个";
        } else if (difficulty === "hard") {
            pool = hardExamples;
            instruction = "从以上人物或同等知名度的大学扩展历史人物中，随机选一个，保持多样性";
        } else {
            pool = hellExamples;
            instruction = "从以上人物或同等知名度的极冷门古代历史人物中，随机选一个，保持多样性";
        }

        prompt = `
你是历史游戏出题系统。

参考人物库：
${pool}

要求：
${instruction}

⚠️严格规则：
- 必须输出真实历史人物
- 不允许犯常识性错误（例如：孔子姓孔是错的，孔子姓孔名丘）
- 只输出JSON格式，不要其他内容

输出格式（严格遵守）：
{
  "name": "人物中文名",
  "bio": "一句话简介（中文，不超过30字）"
}
`;
    }

    // =========================
    // ❓ 提问判断系统
    // =========================
    if (type === "ask") {
        prompt = `
你是历史问答裁判。

当前人物：${character}

玩家问题：${question}

规则：
- 只能回答"是"、"否"、"不确定"三种答案之一
- 不能透露人物姓名
- 不能给额外提示
- 必须用中文回答
`;
    }

    // =========================
    // 💡 递进提示系统
    // =========================
    if (type === "hint") {

        const level = parseInt(hintLevel) || 0;

        let hintInstruction = "";

        if (level === 0) {
            hintInstruction = `
给出【第一级提示】：
- 只说明该人物所处的大致时代（如：古代、中世纪、近代）
- 只说明该人物所在的大致地区（如：东亚、欧洲、中东）
- 不能说具体国家，不能说职业，不能说任何事件
示例风格："这位人物生活在古代东亚地区"
`;
        } else if (level === 1) {
            hintInstruction = `
给出【第二级提示】：
- 可以说明职业或身份类型（如：统治者、科学家、思想家、军事家）
- 可以说明大致活跃领域
- 不能说具体国家名称，不能说具体事件名称
示例风格："这位人物是一位古代思想家，对教育和哲学有深远影响"
`;
        } else if (level === 2) {
            hintInstruction = `
给出【第三级提示】：
- 可以说明具体国家或王朝
- 可以说明一项代表性成就
- 不能直接说出姓名
示例风格："这位人物是中国古代的统治者，统一了中国并建立了第一个中央集权王朝"
`;
        } else {
            hintInstruction = `
给出【最终提示】：
- 可以说明该人物的具体身份（第几代皇帝、哪个领域科学家等）
- 可以说明两项以上代表性成就
- 仍然不能直接说出姓名
示例风格："这位人物是中国秦朝的第一位皇帝，统一了文字、度量衡，修建了长城"
`;
        }

        prompt = `
你是游戏提示系统。

当前人物：${character}

${hintInstruction}

⚠️绝对禁止：
- 禁止出现人物姓名
- 禁止文言文表达
- 禁止诗意化语言
- 禁止英文
- 必须用现代中文白话文
- 只输出一句提示，不要其他内容
`;
    }

    // =========================
    // 🏁 结算系统（生平 + 百科）
    // =========================
    if (type === "end") {

        const { ask = 0, hint = 0, guess = 0 } = stats || {};

        let baseScore = 100;
        if (difficulty === "hard") baseScore = 150;
        if (difficulty === "hell") baseScore = 200;

        const deduction = (ask * 5) + (hint * 10) + (guess * 8);
        const finalScore = Math.max(0, baseScore - deduction);

        const wiki = `https://zh.wikipedia.org/wiki/${encodeURIComponent(character)}`;
        const baidu = `https://baike.baidu.com/item/${encodeURIComponent(character)}`;

        prompt = `
你是游戏结算系统。

当前人物：${character}

必须输出以下内容（全部中文，禁止英文）：

1. 【人物生平】：200字左右，通俗易懂的现代白话文介绍
2. 【主要成就】：列出2-3条主要成就
3. 【历史影响】：一句话说明历史影响

⚠️规则：
- 全部使用中文
- 不允许英文
- 不允许文言文
- 通俗易懂
- 不确定时可说明"史料记载较少"

最后固定输出（不要修改格式）：
本局得分：${finalScore}分
Wikipedia：${wiki}
百度百科：${baidu}
`;
    }

    // =========================
    // 🤖 调用 DeepSeek
    // =========================
    try {
        const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是严格的历史游戏AI系统，只输出要求格式的内容，禁止英文，禁止文言文，使用现代中文白话文。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        return res.status(200).json({
            result: data.choices?.[0]?.message?.content || "AI未返回内容"
        });

    } catch (err) {
        return res.status(500).json({
            result: "调用失败：" + err.message
        });
    }
}