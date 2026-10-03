export async function copyText(text:string):Promise<void>{
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return}catch{/* Use the user-initiated copy fallback below. */}}
  const focused=document.activeElement as HTMLElement|null;
  const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.appendChild(field);field.select();
  try{if(!document.execCommand('copy'))throw new Error('Copy unavailable. Select the address and copy it manually.')}finally{field.remove();focused?.focus()}
}
