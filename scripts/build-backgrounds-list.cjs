/**
 * Scans client/public/backgrounds for image files.
 * Writes list.json and list.js (so the app can show the first image immediately).
 * Run: npm run backgrounds
 */
const fs = require('fs')
const path = require('path')

const backgroundsDir = path.join(__dirname, '..', 'public', 'backgrounds')
const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

if (!fs.existsSync(backgroundsDir)) {
  console.error('Folder not found:', backgroundsDir)
  process.exit(1)
}

const names = fs.readdirSync(backgroundsDir).filter((name) => {
  const lower = name.toLowerCase()
  return ext.some((e) => lower.endsWith(e)) && name !== 'list.json' && name !== 'list.js'
})

const listPath = path.join(backgroundsDir, 'list.json')
fs.writeFileSync(listPath, JSON.stringify(names), 'utf8')

const listJsPath = path.join(backgroundsDir, 'list.js')
const listJs = `window.__BG_LIST__=${JSON.stringify(names)};(function(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}})(window.__BG_LIST__);if(window.__BG_LIST__[0]){var d=document.getElementById("bg-first");if(d){d.style.backgroundImage="url(/backgrounds/"+encodeURIComponent(window.__BG_LIST__[0])+")";}var img=new Image();img.src="/backgrounds/"+encodeURIComponent(window.__BG_LIST__[0]);}`
fs.writeFileSync(listJsPath, listJs, 'utf8')

console.log('Written', names.length, 'images to list.json and list.js')
