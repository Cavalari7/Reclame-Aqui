// --- armazenamento e estados ---
const dbKey = 'rac_db_v1';
let db = JSON.parse(localStorage.getItem(dbKey) || '{}');
if(!db.users) db.users = [];
if(!db.records) db.records = [];
let currentUser = null;
const offensiveWords = ['palavrão1','palavrão2','burro','idiota','porn','xxx'];

// --- util ---
function saveDB(){
  localStorage.setItem(dbKey, JSON.stringify(db));
  updateCounts();
}

function updateCounts(){
  const den = db.records.filter(r=>r.type==='denúncia').length;
  const rec = db.records.filter(r=>r.type==='reclamação').length;
  const ped = db.records.filter(r=>r.type==='pedido').length;
  document.getElementById('countDen').innerText = den;
  document.getElementById('countRec').innerText = rec;
  document.getElementById('countPed').innerText = ped;
}

// --- show/hide passwords ---
function toggleEye(eyeId, inputId){
  document.getElementById(eyeId).addEventListener('click', ()=>{
    const inp = document.getElementById(inputId);
    inp.type = inp.type==='password' ? 'text' : 'password';
  });
}
toggleEye('eye_reg','reg_pass');
toggleEye('eye_reg_confirm','reg_pass_confirm');
toggleEye('eye_login','login_pass');

// --- Registro ---
document.getElementById('btnClear').addEventListener('click', ()=>{
  ['reg_name','reg_email','reg_pass','reg_pass_confirm'].forEach(id=>document.getElementById(id).value='');
});

document.getElementById('btnRegister').addEventListener('click', ()=>{
  const name = document.getElementById('reg_name').value.trim();
  const email = document.getElementById('reg_email').value.trim();
  const pass = document.getElementById('reg_pass').value;
  const passc = document.getElementById('reg_pass_confirm').value;
  if(!name||!email||!pass){ alert('Preencha todos os campos'); return; }
  if(pass!==passc){ alert('Senhas não conferem'); return; }
  if(db.users.find(u=>u.email===email)){ alert('Já existe conta com esse e-mail'); return; }
  db.users.push({name,email,pass});
  saveDB();
  alert('Cadastro realizado. Faça login.');
});

// --- Login ---
document.getElementById('btnLogin').addEventListener('click', ()=>{
  const email = document.getElementById('login_email').value.trim();
  const pass = document.getElementById('login_pass').value;
  const user = db.users.find(u=>u.email===email && u.pass===pass);
  if(!user){ alert('Usuário ou senha inválidos'); return; }
  currentUser = user;
  enterApp();
});

// --- Convidado ---
document.getElementById('btnGuest').addEventListener('click', ()=>{ 
  currentUser = {name:'Convidado'}; 
  enterApp(); 
});

// --- Google placeholder ---
document.getElementById('btnGoogle').addEventListener('click', ()=>{ 
  alert('Botão de autenticação com Google (placeholder).'); 
});

// --- Entrar no app ---
function enterApp(){
  document.getElementById('authView').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
  document.getElementById('welcomeName').innerText = currentUser.name;
  document.getElementById('radioName').innerText = currentUser.name;
  renderRecords();
  updateCounts();
}

// --- Registro de ocorrências ---
let selectedType=null;
document.querySelectorAll('.sector').forEach(el=>{
  el.addEventListener('click', ()=>{
    document.querySelectorAll('.sector').forEach(s=>s.classList.remove('active'));
    el.classList.add('active');
    selectedType = el.dataset.type;
  });
});

document.getElementById('btnSubmit').addEventListener('click', ()=>{
  if(!selectedType){ alert('Selecione um setor'); return; }
  const tags = Array.from(document.querySelectorAll('.tag:checked')).map(t=>t.value);
  const other = document.getElementById('tag_other').value.trim();
  if(other) tags.push(other);
  const who = document.querySelector('input[name="who"]:checked').value==='user' ? currentUser.name : 'Anônimo';
  const desc = document.getElementById('desc').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const data = document.getElementById('data_ocorrencia').value;
  if(!desc||!bairro||!data){ alert('Preencha todos os campos'); return; }

  for(let w of offensiveWords){ 
    if(desc.toLowerCase().includes(w)){ 
      alert('Texto contém palavras ofensivas.'); 
      return; 
    } 
  }

  const fileInput = document.getElementById('file_input');
  let file = null;
  let fileName = null;
  if(fileInput.files.length){
    file = fileInput.files[0];
    fileName = file.name;
    if(file.type.startsWith('image/')){
      const reader = new FileReader();
      reader.onload = e=>{
        file.base64 = e.target.result;
        addRecord();
      }
      reader.readAsDataURL(file);
      return;
    }
  }

  addRecord();

  function addRecord(){
    const rec = {id:Date.now(),type:selectedType,tags,who,desc,bairro,data,file:fileName,comments:[],fileObj:file};
    db.records.unshift(rec);
    saveDB();
    renderRecords();
    document.getElementById('desc').value='';
    document.getElementById('bairro').value='';
    document.getElementById('data_ocorrencia').value='';
    fileInput.value='';
    document.getElementById('filePreview').innerHTML='';
    document.querySelectorAll('.sector').forEach(s=>s.classList.remove('active'));
    selectedType=null;
  }
});

// --- preview de arquivo ---
document.getElementById('file_input').addEventListener('change', e=>{
  const file = e.target.files[0];
  const preview = document.getElementById('filePreview');
  preview.innerHTML='';
  if(!file) return;
  const div = document.createElement('div');
  div.textContent = 'Selecionado: '+file.name+' ('+Math.round(file.size/1024)+' KB)';
  preview.appendChild(div);
});

// --- Render registros ---
function renderRecords(){
  const list = document.getElementById('recordsList');
  list.innerHTML='';
  if(!db.records.length){ 
    list.innerHTML='<div class="small">Nenhum registro ainda — use o formulário acima.</div>'; 
    return; 
  }
  db.records.forEach(r=>{
    const item = document.createElement('div');
    item.className='item';
    let fileHTML = '';
    if(r.fileObj && r.fileObj.base64){
      fileHTML = `<img src="${r.fileObj.base64}" style="max-width:100px;cursor:pointer" class="recordImage"/>`;
    } else if(r.file){
      fileHTML = `📎 ${r.file}`;
    }
    item.innerHTML = `
      <div><strong>${r.type.charAt(0).toUpperCase()+r.type.slice(1)}</strong> — ${r.tags.join(', ')}</div>
      <div>${r.desc}</div>
      <div class="meta"><span>${r.who} • ${r.bairro} • ${r.data}</span> ${fileHTML}</div>
      <div class="comments">
        ${(r.comments||[]).map(c=>`<div class="comment">${c}</div>`).join('')}
        <input type="text" placeholder="Comentar..." data-id="${r.id}" class="commentInput"/>
      </div>`;
    list.appendChild(item);
  });

  document.querySelectorAll('.commentInput').forEach(inp=>{
    inp.addEventListener('keypress', e=>{
      if(e.key==='Enter'){
        const id = parseInt(inp.dataset.id);
        const rec = db.records.find(x=>x.id===id);
        if(inp.value.trim()){
          rec.comments.push(inp.value.trim());
          saveDB();
          renderRecords();
        }
      }
    });
  });

  document.querySelectorAll('.recordImage').forEach(img=>{
    img.addEventListener('click', ()=>{
      const overlay = document.createElement('div');
      overlay.style.position='fixed';
      overlay.style.top=0;
      overlay.style.left=0;
      overlay.style.width='100%';
      overlay.style.height='100%';
      overlay.style.background='rgba(0,0,0,0.8)';
      overlay.style.display='flex';
      overlay.style.alignItems='center';
      overlay.style.justifyContent='center';
      overlay.style.zIndex=1000;

      const bigImg = document.createElement('img');
      bigImg.src = img.src;
      bigImg.style.maxWidth='90%';
      bigImg.style.maxHeight='90%';
      bigImg.style.borderRadius='12px';
      bigImg.style.boxShadow='0 4px 20px rgba(0,0,0,0.5)';

      const closeBtn = document.createElement('div');
      closeBtn.innerText='✖';
      closeBtn.style.position='absolute';
      closeBtn.style.top='20px';
      closeBtn.style.right='30px';
      closeBtn.style.fontSize='28px';
      closeBtn.style.color='#fff';
      closeBtn.style.cursor='pointer';

      closeBtn.addEventListener('click', ()=>document.body.removeChild(overlay));

      overlay.appendChild(bigImg);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);
    });
  });
}

// --- Configurações ---
document.getElementById('openSettings').addEventListener('click', ()=>{
  document.getElementById('settingsPanel').classList.toggle('hidden');
});

document.getElementById('themeLight').addEventListener('click', ()=>{
  document.documentElement.removeAttribute('data-theme');
  document.getElementById('currentTheme').innerText='Claro';
});

document.getElementById('themeDark').addEventListener('click', ()=>{
  document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('currentTheme').innerText='Escuro';
});

document.getElementById('btnDelete').addEventListener('click', ()=>{
  if(!currentUser) return;
  if(confirm('Deseja realmente excluir sua conta?')){
    db.users = db.users.filter(u=>u.email!==currentUser.email);
    db.records = db.records.filter(r=>r.who!==currentUser.name);
    saveDB();
    currentUser=null;
    location.reload();
  }
});

document.getElementById('logout').addEventListener('click', ()=>{
  currentUser=null;
  location.reload();
});
