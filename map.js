'use strict';
// Reimplemented UI using attributed public data; no colleague application code.
const city=data.fusion, cityNames=Object.keys(city.districts);
let citySelected='동대문구';
const cityLabel={drug:'마약범죄',sexual:'강간·강제추행 등',rent:'평균 월세'};
const cityRent=name=>city.rent.districts[name]?.[$('#map-size').value]?.[$('#map-housing').value]??null;
const crimeValue=(name,type,rate=true)=>city.districts[name][type]/(rate?city.districts[name].population/100000:1);
const cityValue=name=>$('#map-category').value==='rent'?(cityRent(name)?.avg??null):crimeValue(name,$('#map-category').value,$('#map-metric').value==='rate');
const unit=()=>$('#map-category').value==='rent'?'만원':($('#map-metric').value==='rate'?'건 / 인구 10만 명':'건');
const palettes=['#ede4e1','#d5bbb5','#b58c82','#906358','#633c34'];
const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
$('#map-housing').innerHTML=city.rent.types.map(x=>`<option${x==='오피스텔'?' selected':''}>${esc(x)}</option>`).join('');
$('#map-size').innerHTML=city.rent.sizes.map(x=>`<option value="${esc(x)}"${x==='10평 이하'?' selected':''}>${x==='10평 이하'?'33.06㎡ 이하':esc(x)}</option>`).join('');
$('#map-district').innerHTML=cityNames.map(x=>`<option${x===citySelected?' selected':''}>${esc(x)}</option>`).join('');
const rings=f=>f.geometry.type==='Polygon'?f.geometry.coordinates:f.geometry.coordinates.flat();
const points=city.geo.features.flatMap(f=>rings(f).flat());
const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
const cos=Math.cos((minY+maxY)/2*Math.PI/180),scale=Math.min(650/((maxX-minX)*cos),505/(maxY-minY));
const X=x=>25+(650-(maxX-minX)*cos*scale)/2+(x-minX)*cos*scale;
const Y=y=>25+(505-(maxY-minY)*scale)/2+(maxY-y)*scale;
const mapSvg=svgNode('svg',{viewBox:'0 0 700 555',role:'group','aria-label':'서울 자치구 지도. Tab으로 지역 이동, Enter로 선택'});
const mapPaths={};
city.geo.features.forEach(f=>{
 const name=f.properties.name;
 const path=svgNode('path',{d:rings(f).map(r=>'M'+r.map(p=>`${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join('L')+'Z').join(' '),'fill-rule':'evenodd',tabindex:'0',role:'button','data-gu':name});
 const title=svgNode('title');path.append(title);
 path.addEventListener('click',()=>selectCity(name));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCity(name);}});
 mapSvg.append(path);mapPaths[name]={path,title};
});
city.geo.features.forEach(f=>{
 const pts=rings(f).flat(),xx=pts.map(p=>X(p[0])),yy=pts.map(p=>Y(p[1]));
 const text=svgNode('text',{x:(Math.min(...xx)+Math.max(...xx))/2,y:(Math.min(...yy)+Math.max(...yy))/2,'text-anchor':'middle','dominant-baseline':'middle','aria-hidden':'true'});text.textContent=f.properties.name;mapSvg.append(text);
});
$('#seoul-map').append(mapSvg);
function selectCity(name){citySelected=name;$('#map-district').value=name;renderCity();}
function renderCity(){
 const values=cityNames.map(cityValue).filter(v=>Number.isFinite(v)).sort((a,b)=>a-b);
 const cuts=[1,2,3,4].map(k=>values[Math.max(0,Math.ceil(values.length*k/5)-1)]);
 const color=v=>v===null?'#bbbbbb':palettes[cuts.filter(c=>v>c).length];
 cityNames.forEach(name=>{const v=cityValue(name),item=mapPaths[name];item.path.setAttribute('fill',color(v));item.path.setAttribute('aria-pressed',String(name===citySelected));item.path.setAttribute('aria-label',`${name}, ${cityLabel[$('#map-category').value]} ${v===null?'자료 없음':fmt(v)+unit()}`);item.title.textContent=item.path.getAttribute('aria-label');});
 $('#map-metric').disabled=$('#map-category').value==='rent';
 $('#map-legend').innerHTML=`<strong>${esc(cityLabel[$('#map-category').value])} · ${unit()}</strong>`+palettes.map((c,i)=>`<span><i style="background:${c}"></i>${i===0?'최솟값':fmt(cuts[i-1])+' 초과'} ~ ${i<4?fmt(cuts[i])+' 이하':'최댓값'}</span>`).join('');
 const d=city.districts[citySelected],r=cityRent(citySelected);
 $('#map-detail').innerHTML=`<h3>${esc(citySelected)}</h3><p class="caption">2024년 · 제공 인구 ${fmt(d.population)}명</p><dl class="city-stats"><div><dt>마약범죄</dt><dd>${fmt(crimeValue(citySelected,'drug'))}<small>인구 10만 명당 · ${fmt(d.drug)}건 발생</small></dd></div><div><dt>강간·강제추행 등</dt><dd>${fmt(crimeValue(citySelected,'sexual'))}<small>인구 10만 명당 · ${fmt(d.sexual)}건 발생</small></dd></div></dl><div class="historic-rent"><h4>2024년 월세 · ${esc($('#map-housing').value)}</h4><p class="caption">${esc($('#map-size').selectedOptions[0].textContent)} · ${r?fmt(r.n)+'건':'자료 없음'}</p><p>평균 <strong>${r?fmt(r.avg)+'만원':'—'}</strong><br>중앙값 ${r?fmt(r.median)+'만원':'—'}<br>평균 보증금 ${r?fmt(r.deposit)+'만원':'—'}</p></div>`;
 const supported=data.districts.includes(citySelected);$('#map-compare').disabled=!supported;
 $('#map-availability').textContent=supported?'선택한 구만 아래 예산 비교에 반영합니다. 최근 계약은 2024년 집계와 기간이 다릅니다.':'이 구는 2024년 집계까지 제공합니다. 최근 개별 계약은 동대문구·성북구·중랑구에서 확인할 수 있습니다.';
 renderCityScatter();
}
function renderCityScatter(){
 const type=$('#scatter-crime').value,rows=cityNames.map(name=>({name,r:cityRent(name),y:crimeValue(name,type)})).filter(x=>x.r&&Number.isFinite(x.r.avg));
 const width=700,height=370,left=72,bottom=55,top=20,right=20;
 const maxRent=Math.max(1,...rows.map(r=>r.r.avg))*1.1,maxCrime=Math.max(1,...rows.map(r=>r.y))*1.1;
 const sx=v=>left+v/maxRent*(width-left-right),sy=v=>height-bottom-v/maxCrime*(height-top-bottom);
 const s=svgNode('svg',{viewBox:`0 0 ${width} ${height}`,role:'group','aria-label':`2024년 평균 월세와 ${cityLabel[type]} 인구 10만 명당 발생 건수 산점도`});
 for(let i=0;i<=4;i++){
  const vx=maxRent*i/4,vy=maxCrime*i/4;
  s.append(svgNode('line',{x1:left,x2:width-right,y1:sy(vy),y2:sy(vy),class:'scatter-grid'}));
  const tx=svgNode('text',{x:sx(vx),y:height-bottom+25,'text-anchor':'middle'});tx.textContent=fmt(vx);s.append(tx);
  const ty=svgNode('text',{x:left-10,y:sy(vy)+4,'text-anchor':'end'});ty.textContent=fmt(vy);s.append(ty);
 }
 rows.forEach(r=>{const dot=svgNode('circle',{cx:sx(r.r.avg),cy:sy(r.y),r:r.name===citySelected?8:5,tabindex:0,role:'button','aria-pressed':String(r.name===citySelected),'aria-label':`${r.name}, 평균 월세 ${fmt(r.r.avg)}만원, 인구 10만 명당 ${fmt(r.y)}건`,class:r.name===citySelected?'selected-dot':'city-dot'});const title=svgNode('title');title.textContent=dot.getAttribute('aria-label');dot.append(title);dot.addEventListener('click',()=>selectCity(r.name));dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCity(r.name);$('#map-district').focus();}});s.append(dot);
 if(r.name===citySelected){const t=svgNode('text',{x:sx(r.r.avg),y:sy(r.y)-14,'text-anchor':'middle'});t.textContent=r.name;s.append(t);}
 });
 const tx=svgNode('text',{x:width/2,y:height-5,'text-anchor':'middle'});tx.textContent='평균 월세 (만원)';s.append(tx);
 $('#city-scatter').replaceChildren(s);
 const mx=rows.reduce((s,r)=>s+r.r.avg,0)/rows.length,my=rows.reduce((s,r)=>s+r.y,0)/rows.length;
 const cov=rows.reduce((s,r)=>s+(r.r.avg-mx)*(r.y-my),0),xx=rows.reduce((s,r)=>s+(r.r.avg-mx)**2,0),yy=rows.reduce((s,r)=>s+(r.y-my)**2,0);
 $('#scatter-description').textContent=`세로축: ${cityLabel[type]} 인구 10만 명당 발생 건수 · ${rows.length}개 구 · 피어슨 상관계수 ${xx&&yy?(cov/Math.sqrt(xx*yy)).toFixed(2):'계산 불가'}. 점을 선택하면 지역 정보가 바뀝니다.`;
}
['map-category','map-metric','map-housing','map-size','scatter-crime'].forEach(id=>$('#'+id).addEventListener('change',renderCity));
$('#map-district').addEventListener('change',e=>selectCity(e.target.value));
$('#map-compare').addEventListener('click',()=>{if(!data.districts.includes(citySelected))return;document.querySelectorAll('[name=district]').forEach(c=>c.checked=c.value===citySelected);render();$('#conditions').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#type').focus({preventScroll:true});});
renderCity();
