'use strict';
// Feature pack (wave 44A): deterministic, offline. Never calls an AI provider.
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;

const FALLBACK_LABEL = 'Deterministic fallback — no AI provider call (aiGenerated: false)';
function providerDisabled(){ return true; }
let _seq = 0;
function createTaskStore(){
  const tasks=[];
  return {
    list(ownerId, query={}){
      let out = tasks.filter(t=>String(t.ownerId)===String(ownerId));
      out = filterRecords(out, query);
      return out;
    },
    create(ownerId, body={}){
      const title = body.title!=null?String(body.title).trim():'';
      const task={ id: ++_seq, ownerId, title, description: body.description!==undefined?body.description:'', status: body.status!==undefined&&body.status!==''?body.status:'todo', priority: body.priority!==undefined&&body.priority!==''?body.priority:'medium', completed: body.completed!==undefined?body.completed:false, estimateHours: body.estimateHours!==undefined?body.estimateHours:0, notes: body.notes!==undefined?body.notes:'', assignee: body.assignee!==undefined?body.assignee:'', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      tasks.push(task); return task;
    },
    update(ownerId, id, body={}){
      const t=tasks.find(x=>x.id===Number(id)&&String(x.ownerId)===String(ownerId)); if(!t) return null;
      for(const k of ['title','description','status','priority','completed','estimateHours','notes','assignee']){ if(Object.prototype.hasOwnProperty.call(body,k)) t[k]=body[k]; }
      t.updatedAt=new Date().toISOString(); return t;
    },
    all(){ return tasks.slice(); }
  };
}
function filterRecords(records, query={}){
  const q=String(query.q||query.search||'').trim().toLowerCase();
  let out=Array.isArray(records)?records.slice():[];
  if(q) out=out.filter(r=>Object.values(r||{}).some(v=>v!=null&&String(v).toLowerCase().includes(q)));
  for(const key of ['status','priority','type','category','platform','sentiment']){
    if(query[key]) out=out.filter(r=>String(r&&r[key])===String(query[key]));
  }
  return out;
}
function csvEscape(v){ if(v==null) return ''; const s=typeof v==='object'?JSON.stringify(v):String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCSV(records){
  const rows=Array.isArray(records)?records:[]; if(!rows.length) return '';
  const cols=[...new Set(rows.flatMap(r=>Object.keys(r||{})))];
  return [cols.join(','), ...rows.map(r=>cols.map(c=>csvEscape(r[c])).join(','))].join('\n');
}
function buildDetailSections(record, spec){
  const rec=record||{};
  return (spec||[]).map(({key,label})=>{
    const value=Object.prototype.hasOwnProperty.call(rec,key)?rec[key]:undefined;
    let display; if(value===false) display='false'; else if(value===0) display='0'; else if(value==='') display='(empty)'; else if(value==null) display='(not set)'; else if(typeof value==='object') display=JSON.stringify(value); else display=String(value);
    return { label, key, value: value===undefined?null:value, display };
  });
}

const DETAIL_SPEC=[{key:'guest_name',label:'Guest'},{key:'site_number',label:'Site'},{key:'status',label:'Status'},{key:'check_in',label:'Check-in'},{key:'check_out',label:'Check-out'},{key:'total_amount',label:'Total amount'},{key:'has_pet',label:'Has pet'},{key:'nights',label:'Nights'}];
function occupancySummary(records){
  const rows=Array.isArray(records)?records:[]; const byStatus={}; let revenue=0;
  for(const r of rows){ byStatus[r.status||'unknown']=(byStatus[r.status||'unknown']||0)+1; if(typeof r.total_amount==='number') revenue+=r.total_amount; else if(r.total_amount!=null&&!isNaN(Number(r.total_amount))) revenue+=Number(r.total_amount); }
  const active=rows.filter(r=>r.status==='confirmed'||r.status==='checked_in').length;
  return { aiGenerated:false, label:FALLBACK_LABEL, feature:'occupancy-summary', total:rows.length, byStatus, active, occupancyShare: rows.length?Math.round((active/rows.length)*100)/100:0, revenue };
}
function noShowRisk(records){
  const rows=(Array.isArray(records)?records:[]).map(r=>{ let score=0; const reasons=[]; if(r.status==='pending'){score+=40;reasons.push('Still pending');} if(!r.guest_id&&!r.guest_name){score+=30;reasons.push('No guest linked');} if(!r.total_amount&&r.total_amount!==0){score+=10;reasons.push('No amount recorded');} return { id:r.id??null, risk:score>=40?'high':score>=20?'medium':'low', score, reasons }; });
  return { aiGenerated:false, label:FALLBACK_LABEL, feature:'no-show-risk', items:rows };
}
function upsellSuggestion(records){
  const rows=Array.isArray(records)?records:[]; const longStays=rows.filter(r=>typeof r.nights==='number'&&r.nights>=7).length;
  return { aiGenerated:false, label:FALLBACK_LABEL, feature:'upsell-suggestion', longStays, suggestion: longStays?'Offer weekly guests a firewood/propane bundle and late checkout.':'Offer short-stay guests an extra-night discount.' };
}
const AI_FEATURES={'occupancy-summary':occupancySummary,'no-show-risk':noShowRisk,'upsell-suggestion':upsellSuggestion};
function ownerId(req){ const u=req.user||{}; return u.id??u.userId??req.userId??u.email??'authenticated-user'; }
function createFeaturePackRouter(options={}){
  const express=require('express'); const router=express.Router(); const store=options.store||createTaskStore(); const fetchMain=options.fetchMainRecords; const auth=options.auth;
  if(auth) router.use(auth);
  async function mainRecords(req){ if(typeof fetchMain==='function'){ try{ const r=await fetchMain(req); return Array.isArray(r)?r:[]; }catch(_){ return []; } } return store.list(ownerId(req)); }
  router.get('/tasks',(req,res)=>res.json({ tasks: store.list(ownerId(req), req.query) }));
  router.post('/tasks',(req,res)=>{ if(!req.body||!String(req.body.title||'').trim()) return res.status(400).json({error:'title is required'}); return res.status(201).json(store.create(ownerId(req), req.body)); });
  const update=(req,res)=>{ const t=store.update(ownerId(req), req.params.id, req.body||{}); if(!t) return res.status(404).json({error:'Task not found'}); return res.json(t); };
  router.put('/tasks/:id', update); router.patch('/tasks/:id', update);
  router.get('/search', async (req,res)=>{ const rows=await mainRecords(req); return res.json({ results: filterRecords(rows, req.query) }); });
  router.get('/export', async (req,res)=>{ const rows=filterRecords(await mainRecords(req), req.query); const format=String(req.query.format||'json').toLowerCase(); if(format==='csv'){ res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="export.csv"'); return res.send(toCSV(rows)); } res.setHeader('Content-Type','application/json'); res.setHeader('Content-Disposition','attachment; filename="export.json"'); return res.json({ exportedAt:new Date().toISOString(), count:rows.length, records:rows }); });
  router.post('/detail-sections',(req,res)=>res.json({ sections: buildDetailSections((req.body&&req.body.record)||{}, DETAIL_SPEC), aiGenerated:false, label:FALLBACK_LABEL }));
  router.post('/ai/:feature', async (req,res)=>{ const fn=AI_FEATURES[req.params.feature]; if(!fn) return res.status(404).json({error:'Unknown AI feature'}); const records=(req.body&&Array.isArray(req.body.records))?req.body.records:await mainRecords(req); return res.json(fn(records)); });
  router.get('/ai/:feature', async (req,res)=>{ const fn=AI_FEATURES[req.params.feature]; if(!fn) return res.status(404).json({error:'Unknown AI feature'}); return res.json(fn(await mainRecords(req))); });
  return router;
}
module.exports={ FALLBACK_LABEL, providerDisabled, createTaskStore, filterRecords, toCSV, buildDetailSections, createFeaturePackRouter, DETAIL_SPEC, AI_FEATURES, ...AI_FEATURES };
