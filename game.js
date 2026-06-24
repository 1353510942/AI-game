
// ================= 用户 =================
let username="";
let character="";
let mode="easy";
let count=0;

// ================= 登录 =================
function login(){
username=document.getElementById("username").value;
if(!username)return alert("输入用户名");

document.getElementById("game").style.display="block";
document.getElementById("welcome").innerText="欢迎："+username;
}

// ================= Supabase（你替换这里） =================
const SUPABASE_URL="https://xddrgmvrcldfnodylwip.supabase.co";
const SUPABASE_KEY="sb_publishable_WLLFrWKugeSBaViGn4OkPQ_Dmp6Zn1z";

// ================= DeepSeek（改为后端调用） =================

// 👉 不再暴露 key

// ================= 开始游戏 =================
async function startGame(){
count=0;
document.getElementById("chat").innerHTML="";

mode=document.getElementById("mode").value;

character=await callServer("choose",mode);

add("AI已选择人物，请开始");
}

// ================= 提问 =================
async function ask(){
let q=document.getElementById("input").value;
if(!q)return;

count++;

add("你："+q);

let res=await callServer("ask",q);

add("AI："+res);

log("ask");
}

// ================= 提示 =================
async function hint(){
let res=await callServer("hint",character);
add("💡提示："+res);
log("hint");
}

// ================= 放弃 =================
async function giveUp(){
let res=await callServer("bio",character);
add("📚答案："+character);
add(res);
log("giveup");
}

// ================= 调用后端 =================
async function callServer(type,data){

let res=await fetch("/api/deepseek",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({type,data,mode})
});

let json=await res.json();
return json.result;
}

// ================= Supabase记录 =================
async function log(action){

await fetch(SUPABASE_URL+"/rest/v1/players",{
method:"POST",
headers:{
"Content-Type":"application/json",
"apikey":SUPABASE_KEY,
"Authorization":"Bearer "+SUPABASE_KEY
},
body:JSON.stringify({
name:username,
mode:mode,
result:action
})
});
}

// ================= UI =================
function add(t){
let d=document.getElementById("chat");
d.innerHTML+="<p>"+t+"</p>";
d.scrollTop=d.scrollHeight;
}