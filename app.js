'use strict';
const data = JSON.parse(document.querySelector('#public-data').textContent);
const $ = s => document.querySelector(s);
const fmt = n => new Intl.NumberFormat('ko-KR', {maximumFractionDigits:1}).format(n);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const median = values => {if (!values.length) return null; const v=[...values].sort((a,b)=>a-b), i=Math.floor(v.length/2); return v.length%2?v[i]:(v[i-1]+v[i])/2;};
let page = 1, filtered = [];
const pageSize = 6;
const selectedDistricts = () => [...document.querySelectorAll('[name=district]:checked')].map(x=>x.value);
const displayMonth = m => `${m.slice(0,4)}.${m.slice(4)}`;
$('#period').textContent = `${displayMonth(data.months[0])} – ${displayMonth(data.months.at(-1))} 계약`;
$('#updated').textContent = `가격 데이터 조회: ${new Date(data.generated).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} (한국시간) · 범죄 통계: ${data.crimeYear}년 고정 자료 · 수동 갱신`;

function render() {
  const districts = selectedDistricts(), monthly = $('#type').value === 'monthly';
  $('#rent-max').disabled = !monthly;
  const min = Number($('#deposit-min').value), max = Number($('#deposit-max').value), rent = Number($('#rent-max').value), area = Number($('#area').value);
  const valid = $('#filters').checkValidity() && ['deposit-min','deposit-max',...(monthly?['rent-max']:[])].every(id=>$('#'+id).value.trim()!=='') && min<=max;
  $('#filter-error').hidden = valid;
  $('#filter-error').textContent = '금액을 0 이상의 숫자로 입력하고, 보증금 최솟값이 최댓값보다 크지 않은지 확인해 주세요.';
  filtered = valid ? data.rent.filter(r=>districts.includes(r.district) && (monthly?r.rent>0:r.rent===0) && r.deposit>=min && r.deposit<=max && (!monthly||r.rent<=rent) && r.area<=area && ($('#contract').value==='all'||r.contract===$('#contract').value)) : [];
  $('#result-count').textContent = `${fmt(filtered.length)}건의 계약`;
  $('#cards').innerHTML = !districts.length ? '<p class="empty">비교할 지역을 하나 이상 선택해 주세요.</p>' : districts.map(d=>{
    const rows=filtered.filter(r=>r.district===d), rents=rows.map(r=>r.rent), deposits=rows.map(r=>r.deposit), value=median(monthly?rents:deposits);
    return `<article class="district-card"><h3>${esc(d)}</h3><div><div class="metric-label">${monthly?'월세':'보증금'} 중앙값</div><div class="big">${value===null?'—':fmt(value)} <span>${value===null?'자료 없음':'만원'}</span></div></div><p class="sub">${monthly?'보증금 중앙값 '+(rows.length?fmt(median(deposits))+'만원':'—'):'전세 계약'}<br>${rows.length?fmt(rows.length)+'건 비교':'조건에 맞는 계약 없음'}</p><small>${rows.length>0&&rows.length<5?'계약 5건 미만 · 가격 해석에 주의하세요.':'면적·보증금·계약 구분에 따라 가격이 달라집니다.'}</small></article>`;
  }).join('');
  page = 1;
  renderRows(); renderCrime();
}
function renderRows(){
  const order=$('#sort').value;
  filtered.sort((a,b)=>order==='date'?b.date.localeCompare(a.date):a[order]-b[order]||b.date.localeCompare(a.date));
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);
  $('#rows').innerHTML=filtered.length?filtered.slice((page-1)*pageSize,page*pageSize).map(r=>`<tr><td class="building" data-label="지역 / 건물"><small>${esc(r.district)} ${esc(r.dong)}</small>${esc(r.building||'건물명 미제공')}</td><td data-label="보증금">${fmt(r.deposit)}<span class="mobile-unit">만원</span></td><td data-label="월세">${r.rent===0?'전세':fmt(r.rent)+'<span class="mobile-unit">만원</span>'}</td><td data-label="면적 / 층">${fmt(r.area)}㎡<small>${esc(r.floor||'미제공')}${r.floor?'층':''}</small></td><td data-label="계약일 / 구분">${esc(r.date)}<small>${esc(r.contract)}</small></td></tr>`).join(''):'<tr><td colspan="5" class="empty">조건에 맞는 계약이 없습니다. 지역을 선택하거나 금액·면적 범위를 넓혀 보세요.</td></tr>';
  $('#page-status').textContent=`${page} / ${pages}`;
  $('#prev').disabled=page<=1;$('#next').disabled=page>=pages;
}
const groups=Object.keys(data.crime[data.districts[0]]);
$('#crime-category').innerHTML=groups.map(g=>`<option value="${esc(g)}"${g==='절도범죄'?' selected':''}>${esc(g)}</option>`).join('');
function renderCrime(){
  const districts=selectedDistricts(),group=$('#crime-category').value;
  const largest=Math.max(1,...data.districts.map(d=>data.crime[d][group]));
  $('#crime-bars').innerHTML=districts.length?districts.map(d=>{const value=data.crime[d][group];return `<div class="crime-row"><span>${esc(d)}</span><div class="bar-track" aria-hidden="true"><div class="bar" style="width:${value/largest*100}%"></div></div><strong>${fmt(value)}건</strong></div>`;}).join(''):'<p>지역을 선택하면 발생 건수를 확인할 수 있습니다.</p>';
}
$('#filters').addEventListener('input',render);
$('#filters').addEventListener('submit',e=>e.preventDefault());
$('#sort').addEventListener('change',()=>{page=1;renderRows();});
$('#crime-category').addEventListener('change',renderCrime);
$('#reset').addEventListener('click',()=>{$('#filters').reset();$('#sort').value='date';render();});
$('#prev').addEventListener('click',()=>{page--;renderRows();});
$('#next').addEventListener('click',()=>{page++;renderRows();});
const checks=[...document.querySelectorAll('[data-check]')];
function checkStatus(){ $('#check-status').textContent=`${checks.filter(x=>x.checked).length} / ${checks.length} 확인`; }
try{const saved=JSON.parse(localStorage.getItem('first-home-checks')||'[]');if(Array.isArray(saved))checks.forEach(x=>x.checked=saved.includes(x.dataset.check));}catch{}
checks.forEach(x=>x.addEventListener('change',()=>{try{localStorage.setItem('first-home-checks',JSON.stringify(checks.filter(x=>x.checked).map(x=>x.dataset.check)));}catch{}checkStatus();}));
$('#clear-checks').addEventListener('click',()=>{checks.forEach(x=>x.checked=false);try{localStorage.removeItem('first-home-checks');}catch{}checkStatus();});
checkStatus();render();
