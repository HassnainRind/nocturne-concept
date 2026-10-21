import { useEffect } from 'react'
import { initNocturne } from './engine.js'
import './nocturne.css'

/* React renders the markup once; engine.js owns the motion (GSAP, Lenis, three.js, canvases) and returns a cleanup. */
export default function Nocturne() {
  useEffect(() => initNocturne(), [])
  return (
<>
<svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true"><filter id="tv"><feTurbulence id="ft" type="fractalNoise" baseFrequency="0 .3" numOctaves="1" result="n"/><feDisplacementMap id="fd" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<canvas id="gl" aria-hidden="true"></canvas><div className="aurora" aria-hidden="true"></div><div className="grain" aria-hidden="true"></div><div className="bar" id="bar"></div>
<div className="cur" aria-hidden="true"><div className="ring"><i></i></div><div className="dot"></div></div>
<div className="trail" id="t0" style={{width:'3px',height:'3px'}}></div><div className="trail" id="t1" style={{width:'2.5px',height:'2.5px'}}></div><div className="trail" id="t2" style={{width:'2px',height:'2px'}}></div><div className="trail" id="t3" style={{width:'1.5px',height:'1.5px'}}></div><div id="pre" aria-hidden="true"><div className="mono"></div><div id="pn">000</div></div>
<nav id="nav"><a href="#top" className="mono brand"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><defs><mask id="mm"><rect width="20" height="20" fill="#fff"/><circle id="mo" cx="24" cy="10" r="8" fill="#000"/></mask></defs><circle cx="10" cy="10" r="8" fill="none" stroke="#F5F5F0" strokeOpacity=".5"/><circle cx="10" cy="10" r="8" fill="#F5F5F0" mask="url(#mm)"/></svg>Nocturne</a>
<span className="mono hide-s" id="clk">00:00:00</span>
<div className="nl mono"><a href="#tl" data-s="tl"><em>02</em>Watch</a><a href="#ins" data-s="ins"><em>03</em>Instruments</a><a href="#idx" data-s="idx"><em>05</em>Index</a><a href="#join" className="cta">Join</a><i id="ind"></i></div>
<button className="mb mono" id="mb" aria-expanded="false" aria-controls="menu">Menu</button></nav>
<div id="menu"><a href="#tl">Watch</a><a href="#ins">Instruments</a><a href="#fnd">Findings</a><a href="#idx">Index</a><a href="#join">Join</a></div>
<main id="top">
<header className="hero"><div className="ret" aria-hidden="true"><i></i><b></b></div>
 <div className="row mono" style={{display:'none'}}><span className="rec" id="st">Window open</span><span>Hours 00:00 → 06:00</span></div>
 <div><h1 id="title">NOCTURNE</h1><div className="row" style={{alignItems:'flex-end',marginTop:'3vh'}}><p className="q">What happens to humanity when the world goes quiet?</p></div></div></header>
<section className="man pad"><p className="mono rv">01 / Premise</p>
 <p id="man">Between midnight and sunrise the masks go slack. We do not intervene. We only listen.</p>
 <div id="qt" className="o" aria-hidden="true">QUIET</div></section>
<section className="viz-section" id="viz1"><canvas id="constellationCanvas"></canvas><div className="viz-label mono"><span>Signal mapping — live field</span></div></section>
<section className="tl" id="tl"><div className="row mono"><span>02 / The Watch</span><span id="pn2">Phase 01 / 05</span></div>
 <div className="wv"><svg id="wave" aria-hidden="true"><line id="sl" y1="0" stroke="rgba(255,255,255,.15)"/><path id="wg" fill="none" stroke="rgba(255,255,255,.15)"/><path id="wp" fill="none" stroke="#F5F5F0" strokeWidth="1.5"/><circle id="g0" r="3" fill="#F5F5F0" opacity="0"/><circle id="g1" r="2" fill="#F5F5F0" opacity="0"/><circle id="g2" r="1.5" fill="#F5F5F0" opacity="0"/><circle id="pr0" r="5" fill="none" stroke="#F5F5F0" strokeWidth=".5" opacity="0"><animate attributeName="r" values="5;22" dur="2.5s" repeatCount="indefinite"/><animate attributeName="opacity" values=".2;0" dur="2.5s" repeatCount="indefinite"/><animate attributeName="stroke-width" values=".6;.05" dur="2.5s" repeatCount="indefinite"/></circle><circle id="hd" r="5" fill="#F5F5F0"/></svg></div>
 <div className="hrs mono"><span>00</span><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div>
 <div id="clock" aria-hidden="true">00:00</div>
 <div className="phase" aria-live="polite"><div className="mono" id="ptm">00:00</div><h3 id="pt">The Hush</h3><p id="pd"></p></div></section>
<section className="hs" id="ins"><p className="mono hs-t">03 / Instruments</p><div className="hs-tr" id="hst">
<h2 className="hsh">Four ways<br /><span className="o">to listen</span></h2>
<article className="pn"><div className="vz v1"></div><div className="cp"><h4>Acoustic Array</h4><span className="mono">400 mics</span></div></article>
<article className="pn"><div className="vz v2"></div><div className="cp"><h4>Thermal Drift</h4><span className="mono">Infrared</span></div></article>
<article className="pn"><div className="vz v3"></div><div className="cp"><h4>Window Census</h4><span className="mono">After 00:00</span></div></article>
<article className="pn"><div className="vz v4"></div><div className="cp"><h4>Confession Corpus</h4><span className="mono">Anonymised</span></div></article></div></section>
<section className="pad" id="fnd"><p className="mono rv">04 / Findings</p>
 <div className="stats"><div><b data-n="14200">0</b><span className="mono">Nights recorded</span></div><div><b data-n="212">0</b><span className="mono">Cities observed</span></div><div><b data-n="3.4" data-d="1">0</b><span className="mono">dB, median hush</span></div><div><b>03:14</b><span className="mono">Hour of peak candour</span></div></div>
 
 <p className="mono live rv">Live: subjects online <b id="sj">4,812,093</b> · ambient <b id="db">21.4</b> dB</p></section>
<section className="iris" id="iris"><div className="ir-in"><div className="ir-n">03:14</div><p className="ir-t">Nine in ten speak true.</p></div></section>
<section className="grid-section" id="gridSec"><div className="grid-pin"><canvas id="gridCanvas" className="grid-canvas"></canvas><div className="grid-label"><h2 className="o">SIGNAL</h2></div></div></section>
<section className="moon" id="moon"><div className="mn-in"><canvas id="moonC" aria-hidden="true"></canvas><svg className="ring-t" viewBox="0 0 400 400" aria-hidden="true"><defs><path id="rp" d="M200 200m-190 0a190 190 0 1 1 380 0a190 190 0 1 1-380 0"/></defs><text><textPath href="#rp" textLength="1190" lengthAdjust="spacing">QUIET • AWAKE • OBSERVED • QUIET • AWAKE • OBSERVED • QUIET • AWAKE • OBSERVED • QUIET • AWAKE • OBSERVED • </textPath></text></svg><p className="mono mn-lb">07 / Phase</p><div className="mn-pct"><b id="moonPct">0%</b><span className="mono">lit</span></div></div></section>
<section className="ridge" id="ridge"><canvas id="ridgeC" aria-hidden="true"></canvas><p className="mono rl-t">08 / Static</p><p className="mono rl-b">Move to disturb</p></section>
<section className="pad" id="idx"><p className="mono rv">05 / Index of Observations</p>
 <h2><span className="sp">Subjects</span> <span className="sp o">of the quiet</span></h2>
 <ul className="rows">
  <li data-cur=""><span className="mono">014</span><b>The Chorus of Insomniacs</b><span className="mono">01:12 / Seoul</span></li>
  <li data-cur=""><span className="mono">027</span><b>Night-Shift Cartography</b><span className="mono">02:40 / Lagos</span></li>
  <li data-cur=""><span className="mono">031</span><b>Rooms That Answer Back</b><span className="mono">03:14 / Reykjavík</span></li>
  <li data-cur=""><span className="mono">044</span><b>The Last Open Window</b><span className="mono">03:58 / Osaka</span></li>
  <li data-cur=""><span className="mono">052</span><b>Letters Never Sent</b><span className="mono">04:31 / Lisbon</span></li>
  <li data-cur=""><span className="mono">066</span><b>Birdsong Before Light</b><span className="mono">05:47 / Nairobi</span></li></ul></section>
<section className="dash" id="dashSec">
<div className="gauge" id="g-nights"><svg viewBox="0 0 120 120"><circle className="track" cx="60" cy="60" r="54"/><circle className="fill" cx="60" cy="60" r="54" strokeDasharray="339.3" strokeDashoffset="339.3"/></svg><div className="gauge-val"><b>0</b><span>Nights</span></div></div>
<div className="gauge" id="g-cities"><svg viewBox="0 0 120 120"><circle className="track" cx="60" cy="60" r="54"/><circle className="fill accent" cx="60" cy="60" r="54" strokeDasharray="339.3" strokeDashoffset="339.3"/></svg><div className="gauge-val"><b>0</b><span>Cities</span></div></div>
<div className="gauge" id="g-candour"><svg viewBox="0 0 120 120"><circle className="track" cx="60" cy="60" r="54"/><circle className="fill" cx="60" cy="60" r="54" strokeDasharray="339.3" strokeDashoffset="339.3"/></svg><div className="gauge-val"><b>0%</b><span>Candour at 03:14</span></div></div>
</section>
<section className="end" id="join"><p className="mono rv" style={{padding:'0 4vw 4vh'}}>06 / Join the watch</p><div className="mq o" id="mq" aria-hidden="true"><span>STAY AWAKE / STAY AWAKE / </span><span>STAY AWAKE / STAY AWAKE / </span></div><div className="mq2 o" id="mq2" aria-hidden="true"><span>OBSERVE / RECORD / LISTEN / </span><span>OBSERVE / RECORD / LISTEN / </span></div>
 <p className="q" style={{margin:'8vh 4vw 0'}}>Night passes admit forty observers a month. You will be asked to stay awake.</p>
 <a className="btn" data-cur="" href="#top">Request a night pass <span>→</span></a>
 <footer className="foot">
 <div className="fgrid">
  <div><p className="mono">Station</p>Observatory of the Quiet Hours<br />Open 00:00 to 06:00 UTC<br />Closed to daylight</div>
  <div><p className="mono">Navigate</p><a href="#tl">The Watch</a><a href="#ins">Instruments</a><a href="#fnd">Findings</a><a href="#idx">Index</a></div>
  <div><p className="mono">Correspondence</p><a className="ul" href="mailto:somehow.wemakeitwork@gmail.com">somehow.wemakeitwork@gmail.com</a>@somehowworks</div>
  <div><p className="mono">Observatory time</p><b id="utc" className="big">00:00:00</b><span className="mono" id="utcs"></span></div>
 </div>
 <div className="wm o" id="wm" aria-hidden="true">SOMEHOW<span style={{color:'#ff4c29',WebkitTextStroke:0}}>.</span></div>
 <div className="mono row legal"><span>© Nocturne, a fictional institute. No names are recorded.</span><a href="#top">↑ Return to the surface</a></div>
</footer>
 </section>
</main>
</>
  )
}
