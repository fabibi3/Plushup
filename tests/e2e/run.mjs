// Parcours E2E complet sur la build web (dist/), viewport mobile.
// Usage : npm run e2e   (build puis test). Chromium : CHROMIUM_PATH=... ou `npx playwright install chromium`.
// Les captures sont écrites dans e2e-screens/ (ignoré par git).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve('dist');
const outDir = path.resolve('e2e-screens');
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  const file = fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
const shot = (n) => page.screenshot({ path: `${outDir}/${n}.png` });
const click = async (text, opts = {}) => { await page.getByText(text, { exact: true, ...opts }).first().click(); await page.waitForTimeout(250); };
const step = (s) => console.log('✓', s);

const t0 = Date.now();
await page.goto(base, { waitUntil: 'networkidle' });
await page.getByText('Ta routine jambes légères').waitFor();
step(`onboarding affiché (${Date.now() - t0} ms, réseau inclus)`);
await shot('01-welcome');

await click('Commencer');
await page.getByPlaceholder('Ton prénom (facultatif)').fill('Salma');
await shot('02-name');
await click('Continuer');
await click('Plutôt assise');
await shot('03-day');
await click('Continuer');
await click('Des jambes plus légères');
await click('Du confort toute la journée');
await click('Continuer');
await click('M');
await click('Continuer');
await click('21:00');
await click('Continuer');
await shot('04-consent');
// Le bouton final doit être désactivé sans consentement.
const finishBtn = page.getByRole('button', { name: 'C’est parti' });
if (!(await finishBtn.isDisabled())) throw new Error('Le bouton final devrait être désactivé sans consentement');
step('consentement obligatoire respecté');
await page.getByRole('checkbox').click();
await finishBtn.click();
await page.getByText('Bonjour Salma').waitFor();
step('onboarding terminé → accueil');
await page.waitForTimeout(500);
await shot('05-today');

await click('Faire mon check-in · 30 s');
await page.getByText('Comment te sens-tu ce soir ?').waitFor();
const save = page.getByRole('button', { name: 'Enregistrer' });
if (!(await save.isDisabled())) throw new Error('Enregistrer devrait être désactivé sans réponse « jambes »');
await page.getByRole('radio', { name: 'Plutôt légères' }).first().click();
await click('6 h');
await click('L’après-midi');
await page.getByRole('radio', { name: 'Confortable', exact: true }).click();
await shot('06-checkin');
await save.click();
await page.getByText('Premier check-in').first().waitFor();
step('célébration « Premier check-in »');
await click('Continuer');
await page.getByText('Check-in fait').waitFor();
step('check-in enregistré');

await click('+1 verre');
await page.getByText('1 verre(s) aujourd’hui').waitFor();
step('hydratation +1');
await shot('07-today-done');

await click('Commencer');
await page.getByText('Respiration ventrale').waitFor();
await shot('08-routine');
for (let i = 0; i < 6; i++) await click('Suivant');
await click('Terminer');
await page.getByText('Routine terminée 🌊').waitFor();
step('routine jour 1 terminée');
await shot('09-routine-done');
await click('Retour à l’accueil');
await page.getByText('Première routine').first().waitFor();
await click('Continuer');
step('célébration « Première routine »');
await page.getByText('Routine faite aujourd’hui').waitFor();
await page.getByText('Série : 1 jour(s)').waitFor();
step('série = 1 jour, routine marquée faite');

await page.getByRole('tab', { name: /Programme/ }).click().catch(async () => click('Programme'));
await page.getByText('21 jours jambes légères').first().waitFor();
await shot('10-programme');
await page.getByText('1/21 jours').waitFor();
step('programme 1/21');

await page.getByRole('tab', { name: /Progrès/ }).click().catch(async () => click('Progrès'));
await page.getByText('Tes 4 dernières semaines').waitFor();
await shot('11-progres');
step('écran progrès');

await page.getByRole('tab', { name: /Moi/ }).click().catch(async () => click('Moi'));
await page.getByText('Sauvegarde & compte').waitFor();
await shot('12-moi');
await click('Ma commande');
await page.getByText('Guide des tailles').waitFor();
await shot('13-commande');
await page.getByRole('button', { name: 'Retour' }).first().click();
await page.waitForTimeout(300);

// Persistance : rechargement complet.
await page.goto(base, { waitUntil: 'networkidle' });
await page.getByText('Bonjour Salma').waitFor();
await page.getByText('Check-in fait').waitFor();
step('données conservées après rechargement (local-first)');

// Passage en arabe (RTL).
await page.getByRole('tab', { name: /Moi/ }).click().catch(async () => click('Moi'));
await click('العربية');
await page.waitForTimeout(800);
const dir = await page.evaluate(() => document.documentElement.dir);
if (dir !== 'rtl') throw new Error('dir attendu rtl, obtenu ' + dir);
step('arabe : <html dir="rtl">');
await shot('14-moi-ar');
await page.getByRole('tab', { name: /اليوم/ }).click().catch(async () => click('اليوم'));
await page.waitForTimeout(500);
await shot('15-today-ar');
await page.getByRole('tab', { name: /حسابي/ }).click().catch(async () => click('حسابي'));
await click('Français');
await page.waitForTimeout(500);

// Suppression des données (mode local, cloud injoignable) → retour à l'onboarding.
await click('Mes données');
const dialogs = [];
page.on('dialog', (d) => { dialogs.push(d.message()); void d.accept(); });
await click('Supprimer mon compte et mes données');
await page.getByText('Ta routine jambes légères').waitFor({ timeout: 15000 });
step('suppression → retour onboarding · dialogues : ' + JSON.stringify(dialogs));


// ---------------------------------------------------------------------------
// Scénario PITCH : profil démo → check-in en direct → célébration « 7 jours d'affilée ».
// ---------------------------------------------------------------------------
{
  const dctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR' });
  const p = await dctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror(demo): ' + e.message));
  const dshot = (n) => p.screenshot({ path: `${outDir}/${n}.png` });
  const dclick = async (text) => { await p.getByText(text, { exact: true }).first().click(); await p.waitForTimeout(300); };
  await p.goto(base, { waitUntil: 'networkidle' });
  await dclick('Découvrir avec un profil exemple');
  await p.getByText('Bonjour Salma').waitFor();
  await p.getByText('Mode démo').waitFor();
  await p.getByText('Série : 6 jour(s)').waitFor();
  step('démo : profil Salma, série de 6 jours');
  await p.waitForTimeout(600);
  await dshot('20-demo-today');
  await dclick('Faire mon check-in · 30 s');
  await p.getByRole('radio', { name: 'Légères', exact: true }).click();
  await dclick('6 h');
  await dclick('L’après-midi');
  await p.getByRole('button', { name: 'Enregistrer' }).click();
  await p.getByText('7 jours d’affilée').first().waitFor();
  await p.waitForTimeout(900);
  await dshot('21-demo-celebration');
  step('démo : check-in → célébration « 7 jours d’affilée »');
  await dclick('Continuer');
  await p.getByText('Série : 7 jour(s)').waitFor();
  await p.mouse.wheel(0, 2000);
  await p.waitForTimeout(400);
  await dshot('22-demo-today-bottom');
  await dclick('Ton bilan de la semaine');
  await p.getByText('Sensation de lourdeur').waitFor();
  await dshot('23-demo-bilan');
  step('démo : bilan de la semaine');
  await p.getByRole('button', { name: 'Retour' }).first().click();
  await p.waitForTimeout(300);
  await p.getByText('Une 2e paire pour la rotation').first().click();
  await p.getByText('Commande #1042').waitFor();
  await p.waitForTimeout(500);
  await dshot('24-demo-commande');
  step('démo : commande liée + réachat + parrainage');
  await p.getByRole('button', { name: 'Retour' }).first().click();
  await p.waitForTimeout(300);
  await p.getByRole('tab', { name: /Progrès/ }).click().catch(async () => dclick('Progrès'));
  await p.getByText('Tes observations').waitFor();
  await dshot('25-demo-progres');
  await p.mouse.wheel(0, 1400);
  await p.waitForTimeout(400);
  await dshot('26-demo-badges');
  step('démo : progrès, observations, badges');
  await p.getByRole('tab', { name: /Programme/ }).click().catch(async () => dclick('Programme'));
  await p.getByText('Ton focus').first().waitFor();
  await dshot('27-demo-programme');
  step('démo : programme + focus personnalisé');
  await dctx.close();
}

console.log('\nErreurs console/page :', errors.length ? '\n  ' + errors.join('\n  ') : 'aucune');
await browser.close();
server.close();
// Les erreurs réseau (cloud injoignable) sont tolérées : l'app doit rester utilisable hors ligne. Une exception JS, non.
if (errors.some((e) => e.startsWith('pageerror'))) process.exit(1);
