const clamp=(t:number)=>Math.max(0,Math.min(1,t));

/** Each chapter gets 1.2 viewport heights at rest, followed by a .8 viewport transition. */
export function journeyProgress(scrollScreens:number){
  const scroll=Math.max(0,scrollScreens),chapter=Math.min(3,Math.floor(scroll/2));
  if(chapter===3)return 3;
  const t=clamp((scroll-chapter*2-1.2)/.8);
  return chapter+t*t*(3-2*t);
}
