(function(){
 const riskScore=()=>{
  const s=window.state; if(!s)return null;
  let score=10, evidence=0, factors=[];
  const w=s.earth?.weather, sat=s.earth?.sentinel;
  if(w){evidence++; if(Number.isFinite(Number(w.precipitation_mm))){const r=Number(w.precipitation_mm);if(r>=25){score+=18;factors.push('Mataas ang recent rainfall');}else if(r>=10){score+=10;factors.push('May noticeable rainfall');}}
   if(Number.isFinite(Number(w.humidity_pct))){const h=Number(w.humidity_pct);if(h>=85){score+=14;factors.push('Mataas ang humidity');}else if(h>=75){score+=7;factors.push('Mataas ang humidity');}}
  }
  if(sat?.items?.length){evidence++;const c=Number(sat.items[0].cloud_cover);if(Number.isFinite(c)){if(c>=60){score+=8;factors.push('Maalam ang satellite image dahil sa ulap');}else if(c>=40){score+=5;factors.push('May ulap sa satellite image');}else factors.push('May usable satellite observation');}}
  const obs=s.observations||[]; if(obs.length){evidence++;let n=0;obs.slice(0,5).forEach(o=>{if(/pest|disease|yellowing|water stress|lodging/i.test(o.type))n++});if(n){score+=Math.min(30,n*10);factors.push(n===1?'May 1 farmer report na kailangang i-verify':`May ${n} farmer reports na kailangang i-verify`);}}
  const crop=s.crop||{}; if(crop.transplant){evidence++;const d=Math.max(0,Math.floor((Date.now()-new Date(crop.transplant))/86400000));if(d>=20&&d<=70){score+=4;factors.push(`Crop age: ${d} days after transplant`);}}
  score=Math.max(0,Math.min(100,score));
  let level,label,cls,action;
  if(score<=20){level='Low';label='Mababa ang risk';cls='good';action='Normal ang signal sa ngayon. I-monitor pa rin ang palayan.'}
  else if(score<=40){level='Monitor';label='Normal, pero monitor';cls='good';action='Regular na field check muna. I-report agad kung may bagong sintomas.'}
  else if(score<=60){level='Watch';label='Kailangang bantayan';cls='warn';action='Mag-field check muna sa mga bahagi ng palayan na may kakaibang kondisyon.'}
  else if(score<=80){level='High';label='High risk — mag-field check';cls='high';action='Mag-field check sa lalong madaling panahon. Huwag muna mag-apply ng pesticide o dagdag na abono base sa score lang.'}
  else {level='Strong';label='Strong warning — verify';cls='high';action='I-verify agad sa field at, kung maaari, magpa-check sa agricultural technician bago gumawa ng major treatment.'}
  const confidence=evidence>=4?'Medium-High':evidence===3?'Medium':evidence===2?'Low-Medium':'Low';
  return {score,label,cls,action,confidence,evidence,factors:factors.length?factors:['Kulang pa ang live evidence']};
 };
 function renderRisk(){const screen=document.querySelector('#intel');if(!screen)return;const result=riskScore();if(!result)return;let card=document.querySelector('#agrisense-risk');if(card)card.remove();const anchor=screen.querySelector('.advice');if(!anchor)return;card=document.createElement('div');card.id='agrisense-risk';card.className='card compact risk-card';const color=result.cls==='high'?'#b43b32':result.cls==='warn'?'#a96b00':'#16794a';card.innerHTML=`<div class="row"><div><small>Agrisense Assessment</small><h2>🧠 ${result.label}</h2></div><span class="risk-score" style="color:${color}">${result.score}%</span></div><div class="risk-bar"><span style="width:${result.score}%;background:${color}"></span></div><div class="row risk-meta"><span class="status ${result.cls==='good'?'':'warn'}">Risk score</span><span class="muted">Confidence: ${result.confidence}</span></div><p><b>Bakit?</b></p><ul class="risk-list">${result.factors.map(x=>`<li>${x}</li>`).join('')}</ul><div class="recommend"><b>🌾 Recommendation</b><p>${result.action}</p></div><small class="muted">Preliminary Agrisense Risk Score — hindi diagnosis. Mas tataas ang confidence habang nadadagdagan ang verified field observations.</small>`;anchor.before(card);}
 let timer;const observe=()=>{clearTimeout(timer);timer=setTimeout(renderRisk,40)};new MutationObserver(observe).observe(document.body,{childList:true,subtree:true});setTimeout(renderRisk,150);
})();
