export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { type, data, mode } = req.body;

    // 🔐 API KEY（绝对不写死！防泄露）
    const API_KEY = process.env.DEEPSEEK_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "Missing API Key" });
    }

    // =========================
    // 🎮 难度系统控制
    // =========================

    let difficultyRule = "";

    if (mode === "easy") {
      difficultyRule = `
人物必须来自中小学历史/语文/数理课本中的常见人物
例如：牛顿、爱因斯坦、孔子、秦始皇、李白
`;
    }

    if (mode === "hard") {
      difficultyRule = `
人物必须是大学或扩展知识人物（半知名）
例如：帖木儿、阿克巴大帝、查理曼、奥斯曼帝国早期统治者
`;
    }

    if (mode === "hell") {
      difficultyRule = `
人物必须是冷门历史人物（普通人基本不知道）
例如：古埃及小法老、波斯冷门天文学家、印度地方王朝创立者
`;
    }

    // =========================
    // 🧠 Prompt 系统
    // =========================

    let prompt = "";

    if (type === "choose") {
      prompt = `
你是一个历史人物选择系统，只输出一个人物名字，不要解释。

要求：
- 必须真实历史人物
- 必须符合难度规则
- 不要重复热门人物

难度规则：
${difficultyRule}

输出格式：
只输出名字（中文）
`;
    }

    if (type === "ask") {
      prompt = `
你是历史判断AI系统，请严格遵守：

规则：
1. 只能回答：是 / 不是 / 不确定
2. 必须用中文
3. 不允许解释超长内容
4. 不允许输出英文
5. 不允许歪曲历史常识

当前人物：${data}

用户提问：${mode}
`;
    }

    if (type === "hint") {
      prompt = `
给出这个历史人物的提示（中文）：
- 不要直接说名字
- 不要英文
- 简短一句话

人物：${data}
`;
    }

    if (type === "bio") {
      prompt = `
用中文介绍该历史人物：

要求：
- 必须中文
- 必须真实历史信息
- 如果你知道英文资料，请翻译成中文
- 最后给出 wiki 和 百度百科链接

人物：${data}
`;
    }

    // =========================
    // 🤖 调用 DeepSeek API
    // =========================

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    // =========================
    // ⚠️ 错误处理（重点！防崩溃）
    // =========================

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({
        error: "DeepSeek API Error",
        detail: err,
      });
    }

    const json = await response.json();

    const result =
      json?.choices?.[0]?.message?.content || "没有返回结果";

    // =========================
    // ✅ 返回前端
    // =========================

    return res.status(200).json({
      result,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Server Error",
      detail: err.message,
    });
  }
}