import {webkit,chromium} from 'playwright';
import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const base='http://127.0.0.1:4255',out='artifacts/hybrid-device-readiness';await mkdir(out,{recursive:true});const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4255','--strictPort'],{stdio:'inherit'});const results=[];
try{
 let ready=false;for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 for(const [name,engine] of [['webkit',webkit],['chromium',chromium]]){
 const browser=await engine.launch();try{
 for(const width of [390,1280]){
 const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,hasTouch:width<720,reducedMotion:'reduce'});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?hybrid=1&device-study=1');await page.getByRole('heading',{level:1}).waitFor();assert.equal(await page.locator('#stage').count(),0);
 const panel=page.getByRole('complementary',{name:'Device performance capture'});assert.ok(await panel.isVisible());assert.ok(await panel.getByRole('button',{name:'Start capture'}).isDisabled());
 await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.textContent?.trim()),'Skip immersive experience');await page.keyboard.press('Enter');await page.waitForFunction(()=>Math.abs(document.querySelector('#research').getBoundingClientRect().top)<5);assert.equal(await page.locator('#stage').count(),0);
 await page.goto(base+'/?hybrid=1&device-study=1#story');await page.waitForFunction(()=>Math.abs(document.querySelector('#story').getBoundingClientRect().top)<5);assert.equal(await page.locator('#stage').count(),0);
 const chapter=page.locator('#story>.chapter').first();assert.equal(await chapter.locator('.copy').evaluate(e=>getComputedStyle(e).opacity),'1');
 // Simulate only the stale ready attributes, not a live WebGL context. This
 // proves CSS precedence for late readiness, not actual context-loss recovery.
 const opacity=await page.evaluate(()=>{const root=document.querySelector('.hybrid-facility'),stage=document.createElement('div');stage.id='stage';stage.dataset.renderer='three';stage.dataset.typographyMode='narrative3d';stage.dataset.narrativeReady='true';root.prepend(stage);const result=getComputedStyle(root.querySelector('.chapter .copy')).opacity;stage.remove();return result;});assert.equal(opacity,'1');
 await page.screenshot({path:out+'/'+name+'-reading-'+width+'.png',timeout:60000});await page.getByRole('link',{name:'Exit to research'}).click();await page.waitForFunction(()=>Math.abs(document.querySelector('#research').getBoundingClientRect().top)<5);assert.equal(await page.locator('#stage').count(),0);
 assert.ok(await panel.getByRole('button',{name:'Start capture'}).isDisabled());assert.deepEqual(errors,[]);results.push({browser:name,width,keyboardSkip:true,readingVisible:true,staleReadyCss:true,devicePanelDisabledWithoutStage:true,errors});await ctx.close();
 }
 }finally{await browser.close();}
 }
 await writeFile(out+'/report.json',JSON.stringify({results,limitation:'Linux WebKit and Chromium with reduced motion; not physical Safari, not WebGL context loss or device FPS.'},null,2));
}finally{server.kill();}
