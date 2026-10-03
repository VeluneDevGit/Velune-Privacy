'use client';
import {useEffect,useRef,useState} from 'react';
import {VeilMark} from './veil-mark';

export default function Entrance({onComplete}:{onComplete:()=>void}) {
  const [revealing,setRevealing]=useState(false);
  const complete=useRef(onComplete);complete.current=onComplete;
  useEffect(()=>{
    const root=document.documentElement;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){
      dispatchEvent(new Event('velune:entrance-skip'));complete.current();return;
    }
    root.dataset.veluneEntrance='preparing';dispatchEvent(new Event('velune:entrance-lock'));
    window.scrollTo(0,0);
    let started=false,timer:ReturnType<typeof setTimeout>;
    const start=()=>{
      if(started)return;started=true;
      setRevealing(true);root.dataset.veluneEntrance='revealing';root.dataset.veluneEntranceStarted=String(performance.now());
      dispatchEvent(new Event('velune:entrance-start'));
      timer=setTimeout(()=>complete.current(),3400);
    };
    addEventListener('velune:scene-ready',start);
    if(root.dataset.veluneSceneReady==='true')start();
    const recovery=setTimeout(start,1800);
    return()=>{
      clearTimeout(timer);clearTimeout(recovery);
      removeEventListener('velune:scene-ready',start);
      delete root.dataset.veluneEntrance;delete root.dataset.veluneEntranceStarted;dispatchEvent(new Event('velune:entrance-end'));
    };
  },[]);
  return <div className={'veil-entrance '+(revealing?'revealing':'')} aria-label="Velune introduction">
    <div className="veil-curtain veil-curtain-top"/>
    <div className="veil-curtain veil-curtain-bottom"/>
    <div className="veil-seam"/>
    <div className="veil-intro-content">
      <div className="veil-intro-halo"/>
      <div className="veil-intro-mark"><VeilMark size={96}/></div>
      <span className="veil-intro-name">velune</span>
      <p>THE WORLD SEES A WALLET.<br/><span>YOU SEE POSSIBILITIES.</span></p>
    </div>
    <button className="veil-intro-skip" onClick={()=>{dispatchEvent(new Event('velune:entrance-skip'));complete.current()}}>Skip intro <span>↗</span></button>
  </div>
}
