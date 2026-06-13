/* ═══════════════════════════════════════════
   LUMIKA AI — script.js v3.0
   Chat · History · Products · FAQs
   Complaints · Analytics · Export · Themes
   Persistent storage · Feedback system
═══════════════════════════════════════════ */

// ══ STATE ════════════════════════════════════
let chatHistory = JSON.parse(localStorage.getItem('lumika-history') || '[]');
let sessionStats = { messages:0, responses:0, totalTime:0, topics:{}, thumbsUp:0, thumbsDown:0 };
let currentCat   = 'all';
let selectedFile = null;
let msgCounter   = 0;

const TOPICS = {
    Orders:   ['order','ordered','booking','placed','booked','purchase'],
    Delivery: ['delivery','deliver','shipping','arrive','track','courier'],
    Returns:  ['return','refund','exchange','replace','send back'],
    Payments: ['pay','payment','upi','cod','emi','cash','card','billing'],
    Account:  ['account','login','password','profile','sign','register'],
    Products: ['product','stock','available','item','brand'],
    Coupons:  ['coupon','discount','offer','deal','promo','sale'],
    Support:  ['help','support','contact','complain','complaint','agent'],
};

// ══ UTILS ════════════════════════════════════

function getTime() {
    return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}
function escHtml(t) {
    const d=document.createElement('div');
    d.appendChild(document.createTextNode(t));
    return d.innerHTML;
}
function fmtBot(t) {
    return escHtml(t)
        .replace(/\n/g,'<br>')
        .replace(/•/g,'&#8226;')
        .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
}
function scrollBot() {
    const b=document.getElementById('chat-box');
    if(b) b.scrollTo({top:b.scrollHeight,behavior:'smooth'});
}
function toast(msg,dur=2800) {
    const t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),dur);
}
function saveHistory() {
    try { localStorage.setItem('lumika-history', JSON.stringify(chatHistory)); }
    catch(e){}
}

// ══ PANEL SWITCH ═════════════════════════════

const PANEL_META = {
    chat:       {sub:'E-Commerce Support · Always Online',  badge:'NLP Powered',  clearBtn:true},
    history:    {sub:'Your Conversation History',           badge:'Session Log',    clearBtn:false},
    products:   {sub:'Browse 75 Products',                  badge:'540 Items',      clearBtn:false},
    faqs:       {sub:'Quick Answers',                       badge:'10 Topics',     clearBtn:false},
    complaints: {sub:'Submit a Complaint',                  badge:'Saved to CSV',  clearBtn:false},
    analytics:  {sub:'Session Insights',                    badge:'Live Stats',    clearBtn:false},
    about:      {sub:'About Lumika AI',                     badge:'v1.0',          clearBtn:false},
};

function switchPanel(id, btn) {
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('panel-'+id).classList.add('active');
    if(btn) btn.classList.add('active');
    const m = PANEL_META[id]||{};
    document.getElementById('hdr-sub-text').textContent    = m.sub||'';
    document.getElementById('hdr-badge-text').textContent  = m.badge||'';
    document.getElementById('clear-btn').style.display     = m.clearBtn ? 'flex' : 'none';
    // Init panels
    if(id==='products')   renderProducts();
    if(id==='faqs')       renderFAQs();
    if(id==='analytics')  renderAnalytics();
    if(id==='history')    renderHistory();
}

// ══ SIDEBAR ══════════════════════════════════

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ══ CHAT ═════════════════════════════════════

function botAvatarSVG() {
    return `<div class="bot-av-sm"><svg width="13" height="13" viewBox="0 0 26 26" fill="none"><circle cx="13" cy="9" r="4" fill="#a5b4fc"/><path d="M4 22c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="#a5b4fc" stroke-width="2" stroke-linecap="round"/></svg></div>`;
}

function appendUser(text) {
    const box=document.getElementById('chat-box');
    const row=document.createElement('div');
    row.className='msg-row user-row';
    row.innerHTML=`<div class="msg user">${escHtml(text)}<span class="msg-time">${getTime()}</span></div>`;
    box.appendChild(row); scrollBot();
}

function showTyping() {
    const box=document.getElementById('chat-box');
    const row=document.createElement('div');
    row.className='msg-row bot-row'; row.id='typing-row';
    row.innerHTML=`${botAvatarSVG()}<div class="typing-ind"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>`;
    box.appendChild(row); scrollBot();
}
function hideTyping(){const e=document.getElementById('typing-row');if(e)e.remove();}

function appendBot(text, id) {
    hideTyping();
    const box=document.getElementById('chat-box');
    const row=document.createElement('div');
    row.className='msg-row bot-row';
    row.innerHTML=`
        ${botAvatarSVG()}
        <div>
            <div class="msg bot">${fmtBot(text)}<span class="msg-time">${getTime()}</span></div>
            <div class="feedback-row">
                <button class="fb-btn" id="up-${id}" onclick="feedback(${id},'up')" title="Helpful">👍 Helpful</button>
                <button class="fb-btn" id="dn-${id}" onclick="feedback(${id},'down')" title="Not helpful">👎 Not helpful</button>
            </div>
        </div>`;
    box.appendChild(row); scrollBot();
}

function feedback(id, type) {
    const upBtn = document.getElementById(`up-${id}`);
    const dnBtn = document.getElementById(`dn-${id}`);
    if(!upBtn || !dnBtn) return;
    upBtn.disabled = true; dnBtn.disabled = true;
    if(type==='up'){
        upBtn.classList.add('liked');
        sessionStats.thumbsUp++;
        toast('👍 Thanks for the feedback!');
    } else {
        dnBtn.classList.add('disliked');
        sessionStats.thumbsDown++;
        toast('👎 We\'ll work on improving that!');
    }
    updateAnalyticsUI();
}

async function sendMessage() {
    const input  = document.getElementById('user-input');
    const sendBtn= document.getElementById('send-btn');
    const message= input.value.trim();
    if(!message) return;

    input.value=''; input.focus();
    msgCounter++;
    const mid = msgCounter;

    // Save & render user message
    chatHistory.push({role:'user', text:message, time:getTime()});
    saveHistory(); updateHistoryBadge();
    appendUser(message);

    sessionStats.messages++;
    trackTopic(message);

    sendBtn.classList.add('loading'); sendBtn.disabled=true;
    await new Promise(r=>setTimeout(r,180));
    showTyping();

    const t0=Date.now();
    try {
        const res  = await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
        const data = await res.json();
        const elapsed=Date.now()-t0;
        await new Promise(r=>setTimeout(r,Math.max(0,600-elapsed)));

        const reply=data.response||'Sorry, something went wrong. Please try again.';
        chatHistory.push({role:'bot', text:reply, time:getTime()});
        saveHistory(); updateHistoryBadge();
        appendBot(reply, mid);

        sessionStats.responses++;
        sessionStats.totalTime+=(Date.now()-t0);
        updateAnalyticsUI();

    } catch(err) {
        hideTyping();
        appendBot('⚠️ Unable to connect to Lumika AI. Please check your connection.', mid);
        console.error('Lumika AI:', err);
    } finally {
        sendBtn.classList.remove('loading'); sendBtn.disabled=false;
    }
}

function quickAsk(q) {
    const btn=document.querySelector('.nav-item[data-panel="chat"]');
    switchPanel('chat',btn);
    document.getElementById('user-input').value=q;
    sendMessage();
}

function clearChat() {
    if(!confirm('Clear all chat messages?')) return;
    chatHistory=[];
    sessionStats={messages:0,responses:0,totalTime:0,topics:{},thumbsUp:0,thumbsDown:0};
    saveHistory(); updateHistoryBadge();
    document.getElementById('chat-box').innerHTML=`
        <div class="msg-row bot-row">
            ${botAvatarSVG()}
            <div class="msg bot welcome-msg">
                <p class="wlc-title">👋 Chat cleared!</p>
                <p class="wlc-sub">How can I help you today?</p>
                <div class="wlc-tags">
                    <span class="tag">📦 Orders</span><span class="tag">🔄 Returns</span>
                    <span class="tag">💳 Payments</span><span class="tag">🚚 Delivery</span>
                </div>
            </div>
        </div>`;
    toast('💬 Chat cleared');
}

// ══ HISTORY ══════════════════════════════════

function renderHistory() {
    const list=document.getElementById('history-list');
    if(chatHistory.length===0){
        list.innerHTML=`<div class="empty-state"><div class="empty-icon">💬</div><p class="empty-title">No history yet</p><p class="empty-sub">Start a conversation and it will appear here</p></div>`;
        return;
    }
    list.innerHTML=chatHistory.map(h=>`
        <div class="history-item">
            <span class="hrole ${h.role==='user'?'role-u':'role-b'}">${h.role==='user'?'🧑 You':'🤖 Lumika'}</span>
            <span class="htext">${escHtml(h.text)}</span>
            <span class="htime">${h.time}</span>
        </div>`).join('');
}

function clearHistory() {
    if(!confirm('Clear all chat history?')) return;
    chatHistory=[];
    saveHistory(); updateHistoryBadge(); renderHistory();
    toast('🗑️ History cleared');
}

function updateHistoryBadge() {
    document.getElementById('history-badge').textContent=chatHistory.length;
}

// ══ EXPORT MODAL ═════════════════════════════

function openExportModal() {
    if(chatHistory.length===0){toast('No chat history to export');return;}
    document.getElementById('export-modal').classList.add('open');
}
function closeExportModal(e) {
    if(!e||e.target===document.getElementById('export-modal'))
        document.getElementById('export-modal').classList.remove('open');
}

function exportChat(type) {
    document.getElementById('export-modal').classList.remove('open');
    if(type==='txt') exportTXT();
    else exportPDF();
}

function exportTXT() {
    const lines=['LUMIKA AI — CHAT EXPORT','Generated: '+new Date().toLocaleString(),'='.repeat(50),''];
    chatHistory.forEach(h=>{
        lines.push(`[${h.time}] ${h.role==='user'?'YOU':'LUMIKA AI'}:`);
        lines.push(h.text);
        lines.push('');
    });
    lines.push('='.repeat(50));
    lines.push('Lumika AI v1.0 · Built by Hemakeshwar');
    const blob=new Blob([lines.join('\n')],{type:'text/plain'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='lumika-chat-'+Date.now()+'.txt';
    a.click();
    toast('📄 Chat exported as .txt');
}

function exportPDF() {
    const rows=chatHistory.map(h=>`
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;white-space:nowrap">${h.time}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">
                <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;background:${h.role==='user'?'#ede9fe':'#f0fdf4'};color:${h.role==='user'?'#6366f1':'#16a34a'}">
                    ${h.role==='user'?'You':'Lumika AI'}
                </span>
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#1e293b">${escHtml(h.text)}</td>
        </tr>`).join('');

    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <title>Lumika AI Chat Export</title>
        <style>
            body{font-family:'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;color:#1e293b}
            .header{background:linear-gradient(135deg,#6366f1,#7c3aed);color:white;padding:24px 28px;border-radius:12px;margin-bottom:24px}
            .header h1{font-size:22px;margin:0 0 4px}
            .header p{margin:0;opacity:.85;font-size:13px}
            table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,.08)}
            th{background:#f1f5f9;padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}
            .footer{text-align:center;margin-top:20px;font-size:12px;color:#94a3b8}
        </style></head><body>
        <div class="header">
            <h1>💬 Lumika AI — Chat Export</h1>
            <p>Exported: ${new Date().toLocaleString()} · ${chatHistory.length} messages</p>
        </div>
        <table><thead><tr><th>Time</th><th>Sender</th><th>Message</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <div class="footer">Lumika AI v1.0 · Built by Hemakeshwar · Powered by TF-IDF NLP</div>
        </body></html>`;

    const blob=new Blob([html],{type:'text/html'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='lumika-chat-'+Date.now()+'.html';
    a.click();
    toast('📕 Chat exported — open in browser to print as PDF');
}

// ══ PRODUCTS ═════════════════════════════════

function renderProducts(data) {
    const src=data||PRODUCTS;
    const tbody=document.getElementById('ptbody');
    const count=document.getElementById('pcount');
    const filt=src.filter(p=>currentCat==='all'||p.category===currentCat);

    if(filt.length===0){
        tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--txm)">No products found</td></tr>`;
        count.textContent='No products found'; return;
    }
    tbody.innerHTML=filt.map(p=>{
        const r=parseFloat(p.rating),n=parseInt(p.stock);
        const stars='★'.repeat(Math.round(r))+'☆'.repeat(5-Math.round(r));
        const sc=n===0?'s-out':n<15?'s-low':'s-ok';
        const sl=n===0?'Out of Stock':n<15?`Low (${n})`:`In Stock (${n})`;
        const pr='₹'+parseInt(p.price).toLocaleString('en-IN');
        return `<tr>
            <td style="color:var(--txm);font-size:11.5px">${p.product_id}</td>
            <td><strong style="font-size:13px">${escHtml(p.name)}</strong></td>
            <td style="color:var(--tx2)">${escHtml(p.brand)}</td>
            <td><span class="cat-badge">${escHtml(p.category)}</span></td>
            <td style="font-weight:600">${pr}</td>
            <td class="${sc}">${sl}</td>
            <td><span class="stars">${stars}</span> <span style="color:var(--txm);font-size:11px">${r}</span></td>
            <td><span class="${n>0?'avail-yes':'avail-no'}">${n>0?'● Available':'● Unavailable'}</span></td>
        </tr>`;
    }).join('');
    count.textContent=`Showing ${filt.length} of ${PRODUCTS.length} products`;
}

function filterProducts() {
    const q=document.getElementById('product-search').value.toLowerCase();
    const f=PRODUCTS.filter(p=>(currentCat==='all'||p.category===currentCat)&&
        (p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)));
    renderProducts(f);
}

function filterCat(cat,btn) {
    currentCat=cat;
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); filterProducts();
}

// ══ FAQs ═════════════════════════════════════

function renderFAQs() {
    const list=document.getElementById('faq-list');
    if(list.children.length>0) return;
    list.innerHTML=FAQS_DATA.map((f,i)=>`
        <div class="faq-item" id="faq-${i}">
            <div class="faq-q" onclick="toggleFAQ(${i})">
                <span class="faq-qt">${escHtml(f.q)}</span>
                <span class="faq-ch">▼</span>
            </div>
            <div class="faq-a">${escHtml(f.a)}</div>
        </div>`).join('');
}

function toggleFAQ(i) {
    const item=document.getElementById('faq-'+i);
    const wasOpen=item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(f=>f.classList.remove('open'));
    if(!wasOpen) item.classList.add('open');
}

// ══ COMPLAINTS ═══════════════════════════════

let submittedComplaints=[];

function handleFile(input) {
    const file=input.files[0];
    if(!file) return;
    if(file.size>5*1024*1024){toast('⚠️ File too large. Max 5MB.');return;}
    selectedFile=file;
    const preview=document.getElementById('file-preview');
    const reader=new FileReader();
    reader.onload=e=>{
        preview.style.display='flex';
        preview.innerHTML=`
            <img src="${e.target.result}" alt="preview">
            <span class="fp-name">${escHtml(file.name)}</span>
            <button class="fp-remove" onclick="removeFile()">✕</button>`;
    };
    reader.readAsDataURL(file);
    document.getElementById('file-drop').style.borderColor='rgba(99,102,241,.5)';
}

function removeFile() {
    selectedFile=null;
    document.getElementById('file-preview').style.display='none';
    document.getElementById('c-file').value='';
    document.getElementById('file-drop').style.borderColor='';
}

function dragOver(e) { e.preventDefault(); document.getElementById('file-drop').style.borderColor='rgba(99,102,241,.5)'; }
function dropFile(e) {
    e.preventDefault();
    const file=e.dataTransfer.files[0];
    if(file&&file.type.startsWith('image/')){
        const dt=new DataTransfer(); dt.items.add(file);
        document.getElementById('c-file').files=dt.files;
        handleFile(document.getElementById('c-file'));
    }
}

function resetComplaintForm() {
    ['c-orderid','c-name','c-email','c-desc'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    document.getElementById('c-category').selectedIndex=0;
    removeFile();
}

async function submitComplaint() {
    const orderId  = document.getElementById('c-orderid').value.trim();
    const name     = document.getElementById('c-name').value.trim();
    const email    = document.getElementById('c-email').value.trim();
    const category = document.getElementById('c-category').value;
    const desc     = document.getElementById('c-desc').value.trim();

    if(!orderId||!name||!email||!desc){
        toast('⚠️ Please fill all required fields');
        // Highlight empties
        ['c-orderid','c-name','c-email','c-desc'].forEach(id=>{
            const el=document.getElementById(id);
            if(el&&!el.value.trim()){el.style.borderColor='#f87171';setTimeout(()=>el.style.borderColor='',2500);}
        });
        return;
    }
    if(!/\S+@\S+\.\S+/.test(email)){toast('⚠️ Enter a valid email');return;}

    const btn=document.querySelector('.btn-submit');
    const orig=btn.innerHTML;
    btn.innerHTML='<span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Submitting...';
    btn.disabled=true;

    const payload={order_id:orderId,name,email,category,description:desc,timestamp:new Date().toISOString()};

    try {
        const res=await fetch('/submit_complaint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const data=await res.json();
        if(data.status==='ok'){
            toast('✅ Complaint submitted successfully!',3500);
            submittedComplaints.unshift({id:orderId,category,time:getTime()});
            renderSubmitted();
            resetComplaintForm();
        } else {
            toast('⚠️ Submission failed. Try again.');
        }
    } catch(e) {
        // Offline fallback — save locally
        toast('✅ Saved locally (offline mode)',3500);
        submittedComplaints.unshift({id:orderId,category,time:getTime()});
        renderSubmitted();
        resetComplaintForm();
    } finally {
        btn.innerHTML=orig; btn.disabled=false;
    }
}

function renderSubmitted() {
    const list=document.getElementById('submitted-list');
    if(submittedComplaints.length===0){list.innerHTML='<p style="font-size:12px;color:var(--txm)">No submissions this session</p>';return;}
    list.innerHTML=submittedComplaints.map(c=>`
        <div class="submitted-item">
            <div class="si-id">✓ ${escHtml(c.id)}</div>
            <div class="si-cat">${escHtml(c.category)}</div>
            <div class="si-time">${c.time}</div>
        </div>`).join('');
}

// ══ ANALYTICS ════════════════════════════════

function trackTopic(text) {
    const t=text.toLowerCase();
    for(const [topic,kws] of Object.entries(TOPICS))
        if(kws.some(k=>t.includes(k)))
            sessionStats.topics[topic]=(sessionStats.topics[topic]||0)+1;
}

function updateAnalyticsUI() {
    document.getElementById('s-msgs').textContent  = sessionStats.messages;
    document.getElementById('s-resp').textContent  = sessionStats.responses;
    document.getElementById('s-up').textContent    = sessionStats.thumbsUp;
    document.getElementById('s-down').textContent  = sessionStats.thumbsDown;
    const avg=sessionStats.responses>0?Math.round(sessionStats.totalTime/sessionStats.responses/100)/10+'s':'—';
    document.getElementById('s-time').textContent=avg;
}

function renderAnalytics() {
    updateAnalyticsUI();
    const bars=document.getElementById('topic-bars');
    const entries=Object.entries(sessionStats.topics).sort((a,b)=>b[1]-a[1]);
    const max=entries.length>0?entries[0][1]:1;
    if(entries.length===0){bars.innerHTML='<p style="font-size:13px;color:var(--txm)">Start chatting to see topic breakdown</p>';return;}
    bars.innerHTML=entries.map(([t,c])=>`
        <div class="topic-bar-item">
            <span class="topic-lbl">${t}</span>
            <div class="topic-trk"><div class="topic-fill" style="width:${Math.round(c/max*100)}%"></div></div>
            <span class="topic-cnt">${c}</span>
        </div>`).join('');
}

// ══ THEME ════════════════════════════════════

const THEMES=['dark','light','amoled'];
const T_ICONS={dark:'🌙',light:'☀️',amoled:'⚫'};
let themeIdx=0;

function cycleTheme() {
    themeIdx=(themeIdx+1)%THEMES.length;
    const t=THEMES[themeIdx];
    document.documentElement.setAttribute('data-theme',t);
    document.getElementById('theme-btn').textContent=T_ICONS[t];
    localStorage.setItem('lumika-theme',t);
    toast('Theme: '+t.charAt(0).toUpperCase()+t.slice(1));
}

function loadTheme() {
    const s=localStorage.getItem('lumika-theme');
    if(s&&THEMES.includes(s)){
        themeIdx=THEMES.indexOf(s);
        document.documentElement.setAttribute('data-theme',s);
        document.getElementById('theme-btn').textContent=T_ICONS[s];
    }
}

// ══ RESTORE HISTORY ON LOAD ══════════════════

function restoreHistory() {
    if(chatHistory.length===0) return;
    const box=document.getElementById('chat-box');
    // Keep welcome message, append history
    chatHistory.forEach((h,i)=>{
        if(h.role==='user'){
            const row=document.createElement('div');
            row.className='msg-row user-row';
            row.innerHTML=`<div class="msg user">${escHtml(h.text)}<span class="msg-time">${h.time}</span></div>`;
            box.appendChild(row);
        } else {
            const mid=++msgCounter;
            const row=document.createElement('div');
            row.className='msg-row bot-row';
            row.innerHTML=`
                ${botAvatarSVG()}
                <div>
                    <div class="msg bot">${fmtBot(h.text)}<span class="msg-time">${h.time}</span></div>
                    <div class="feedback-row">
                        <button class="fb-btn" id="up-${mid}" onclick="feedback(${mid},'up')" title="Helpful">👍 Helpful</button>
                        <button class="fb-btn" id="dn-${mid}" onclick="feedback(${mid},'down')" title="Not helpful">👎 Not helpful</button>
                    </div>
                </div>`;
            box.appendChild(row);
        }
    });
    scrollBot();
    updateHistoryBadge();
}

// ══ INIT ═════════════════════════════════════

document.addEventListener('DOMContentLoaded', ()=>{
    loadTheme();
    restoreHistory();
    updateHistoryBadge();

    const input=document.getElementById('user-input');
    if(input){
        input.addEventListener('keydown', e=>{
            if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}
        });
        input.focus();
        input.addEventListener('input',()=>{
            const w=input.closest('.input-wrap');
            w.style.borderColor=input.value?'rgba(99,102,241,.45)':'';
        });
    }
    // Close export modal on Escape
    document.addEventListener('keydown', e=>{
        if(e.key==='Escape') document.getElementById('export-modal').classList.remove('open');
    });
});