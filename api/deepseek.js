
export default async function handler(req,res){

const {type,data,mode}=req.body;

// 🔑 DeepSeek Key（只放这里！！安全！！）
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_KEY;

let prompt="";

if(type==="choose"){

prompt=`
选择一个历史人物：

难度：
easy=课本人物
hard=大学人物
hell=冷门人物

只输出名字
难度：${data}
`;

}

if(type==="ask"){
prompt=`
你是历史判断系统，只能中文回答。
人物：${data}
回答：是/否/不确定 + 简短解释
`;
}

if(type==="hint"){
prompt=`给人物提示（不要说名字）：${data}`;
}

if(type==="bio"){
prompt=`用中文介绍人物生平：${data}`;
}

const r=await fetch("https://api.deepseek.com/v1/chat/completions",{
method:"POST",
headers:{
"Authorization":"Bearer "+DEEPSEEK_API_KEY,
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"deepseek-chat",
messages:[{role:"user",content:prompt}]
})
});

const json=await r.json();

res.status(200).json({
result:json.choices[0].message.content
});
}