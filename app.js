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
  const den = db.records.filter(r=>r.type==='denuncia').length;
  const rec = db.records.filter(r=>r.type==='reclamacao').length;
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

// --- Seletor de setores ---
document.querySelectorAll('.sector').forEach(el=>{
  el.addEventListener('click', ()=>{
    document.querySelectorAll('.sector').forEach(e=>e.classList.remove('active'));
    el.classList.add('active');
  });
});

// --- Envio de ocorrência ---
document.getElementById('btnSubmit').addEventListener('click', ()=>{
  const typeEl = document.querySelector('.sector.active');
  if(!typeEl){ alert('Escolha um setor'); return; }
  const typeMap = {'denuncia':'denuncia','reclamacao':'reclamacao','pedido':'pedido'};
  const type = typeMap[typeEl.dataset.type];

  let tags = Array.from(document.querySelectorAll('.tag:checked')).map(t=>t.value);
  const other = document.getElementById('tag_other').value.trim();
  if(other) tags.push(other);

  const who = document.querySelector('input[name="who"]:checked').value==='anon' ? 'Anônimo' : currentUser.name;
  const desc = document.getElementById('desc').value.trim();
  const bairro = document.getElementById('bairro').value.trim();
  const data_ocorrencia = document.getElementById('data_ocorrencia').value;

  if(!desc||!bairro||!data_ocorrencia){ alert('Preencha todos os campos obrigatórios'); return; }

  // Filtrar palavras ofensivas
  const textAll = (desc+' '+tags.join(' ')).toLowerCase();
  if(offensiveWords.some(w=>textAll.includes(w))){ alert('Texto contém palavras ofensivas'); return; }

  // arquivo
  const fileInput = document.getElementById('file_input');
  let fileData = null;
  if(fileInput.files.length){
    const file = fileInput.files[0];
    const fName = file.name.toLowerCase();
    if(offensiveWords.some(w=>fName.includes(w))){ alert('Arquivo não permitido'); return; }
    const reader = new FileReader();
    reader.onload = function(e){
      fileData = {name:file.name, type:file.type, content:e.target.result};
      addRecord(type,who,desc,bairro,data_ocorrencia,tags,fileData);
    }
    reader.readAsDataURL(file);
  } else {
    addRecord(type,who,desc,bairro,data_ocorrencia,tags,fileData);
  }
});

function addRecord(type,who,desc,bairro,data_ocorrencia,tags,file){
  db.records.push({id:Date.now(), type, who, desc, bairro, data_ocorrencia, tags, file, comments:[]});
  saveDB();
  renderRecords();
  alert('Ocorrência registrada!');
  document.getElementById('desc').value='';
  document.getElementById('bairro').value='';
  document.getElementById('data_ocorrencia').value='';
  document.getElementById('file_input').value='';
  document.querySelectorAll('.tag').forEach(t=>t.checked=false);
  document.getElementById('tag_other').value='';
  document.querySelectorAll('.sector').forEach(s=>s.classList.remove('active'));
}

// --- Render registros ---
function renderRecords(){
  const container = document.getElementById('recordsList');
  container.innerHTML = '';
  if(!db.records.length){
    container.innerHTML = '<div class="small">Nenhum registro ainda — use o formulário acima.</div>';
    return;
  }
  db.records.slice().reverse().forEach(r=>{
    const div = document.createElement('div');
    div.className='item';
    div.innerHTML = `
      <div><strong>[${r.type.toUpperCase()}]</strong> ${r.who} - ${r.data_ocorrencia}</div>
      <div><em>${r.bairro}</em></div>
      <div>${r.desc}</div>
      ${r.tags.length?'<div class="small">Assuntos: '+r.tags.join(', ')+'</div>':''}
      ${r.file?'<div class="small">Arquivo: '+r.file.name+'</div>':''}
      <div class="comments">
        ${r.comments.map(c=>`<div class="comment">${c}</div>`).join('')}
        <input type="text" placeholder="Comentar..." class="commentInput" data-id="${r.id}"/>
      </div>
    `;
    container.appendChild(div);
  });
}

// --- Comentários ---
document.addEventListener('keypress', e=>{
  if(e.target.classList.contains('commentInput') && e.key==='Enter'){
    const id = parseInt(e.target.dataset.id);
    const text = e.target.value.trim();
    if(!text) return;
    if(offensiveWords.some(w=>text.toLowerCase().includes(w))){ alert('Comentário contém palavras ofensivas'); return; }
    const rec = db.records.find(r=>r.id===id);
    rec.comments.push(text);
    saveDB();
    renderRecords();
  }
});

// --- Configurações ---
document.getElementById('themeLight').addEventListener('click', ()=>{
  document.documentElement.removeAttribute('data-theme');
  document.getElementById('currentTheme').innerText='Claro';
});
document.getElementById('themeDark').addEventListener('click', ()=>{
  document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('currentTheme').innerText='Escuro';
});

document.getElementById('btnDelete').addEventListener('click', ()=>{
  if(confirm('Deseja realmente excluir sua conta? Todos os dados serão perdidos.')){
    if(currentUser && currentUser.email){
      db.users = db.users.filter(u=>u.email!==currentUser.email);
    }
    currentUser=null;
    saveDB();
    location.reload();
  }
});

document.getElementById('logout').addEventListener('click', ()=>{
  currentUser=null;
  location.reload();
});
