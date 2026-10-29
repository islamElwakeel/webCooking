import { FIREBASE_CONFIG, WHATSAPP_NUMBER, KITCHEN_NAME } from './config.js';
export { KITCHEN_NAME };
// item type -> menu section name
export const TYPES = { 'طبق': 'أطباق', 'طاجن': 'طواجن', 'صينية': 'صواني', 'سندوتش': 'ع الماشي', 'سلطة': 'سلطات ومقبلات' };

export const money = n => n == null || n === '' ? 'السعر على الواتساب' : `${Number(n).toLocaleString('ar-EG')} ج.م`;
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
             set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
export { ls };

// ---- Storage: Firebase when configured, otherwise this device only (demo mode) ----
export const DEMO = !FIREBASE_CONFIG;
let fb;
async function firebase() {
  if (fb) return fb;
  const v = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const [{ initializeApp }, fs, auth] = await Promise.all([
    import(v + 'firebase-app.js'), import(v + 'firebase-firestore.js'), import(v + 'firebase-auth.js')]);
  const app = initializeApp(FIREBASE_CONFIG);
  return fb = { fs, db: fs.getFirestore(app), auth, a: auth.getAuth(app) };
}

export async function listItems() {
  if (DEMO) {
    const { SEED_VERSION } = await import('./seed.js');
    return ls.get('seedVersion', 0) === SEED_VERSION && ls.get('items', null) || seedDemo();
  }
  const { fs, db } = await firebase();
  const snap = await fs.getDocs(fs.collection(db, 'items'));
  return snap.docs.map(x => ({ id: x.id, ...x.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
async function seedDemo() {
  const { SEED, SEED_VERSION } = await import('./seed.js');
  const items = SEED.map((x, i) => ({ ...x, id: 'i' + i, order: i }));
  ls.set('items', items); ls.set('seedVersion', SEED_VERSION);
  return items;
}
export async function saveItem(item) {
  if (!item.order && item.order !== 0) item.order = Date.now();
  if (DEMO) {
    const items = await listItems();
    if (!item.id) item.id = 'i' + Date.now();
    const i = items.findIndex(x => x.id === item.id);
    i < 0 ? items.push(item) : items[i] = item;
    try { localStorage.setItem('items', JSON.stringify(items)); }
    catch { throw new Error('مساحة الجهاز امتلأت، جرّب صورة أصغر'); }
    return;
  }
  const { fs, db } = await firebase();
  const { id, ...data } = item;
  id ? await fs.setDoc(fs.doc(db, 'items', id), data) : await fs.addDoc(fs.collection(db, 'items'), data);
}
export async function deleteItem(id) {
  if (DEMO) return ls.set('items', (await listItems()).filter(x => x.id !== id));
  const { fs, db } = await firebase();
  await fs.deleteDoc(fs.doc(db, 'items', id));
}
export async function seedFirebase() {
  const { SEED } = await import('./seed.js');
  for (const [i, x] of SEED.entries()) await saveItem({ ...x, order: i });
}

// ---- Admin login (Firebase email/password). Demo mode has no login. ----
export async function onAdmin(cb) {
  if (DEMO) return cb(true);
  const { auth, a } = await firebase();
  auth.onAuthStateChanged(a, u => cb(!!u));
}
export async function login(email, pass) { const { auth, a } = await firebase(); await auth.signInWithEmailAndPassword(a, email, pass); }
export async function logout() { const { auth, a } = await firebase(); await auth.signOut(a); }

// ---- Cart ----
export const cart = { get: () => ls.get('cart', []), set: c => ls.set('cart', c) };

export function cartTotals(lines, items) {
  let total = 0, unpriced = 0;
  const rows = lines.map(l => {
    const it = items.find(x => x.id === l.id), s = it?.sizes?.[l.size];
    if (!it || !s || it.hidden) return null;
    const price = s.price == null || s.price === '' ? null : Number(s.price);
    price == null ? unpriced++ : total += price * l.qty;
    return { ...l, name: it.name, sizeLabel: s.label, price, image: it.image };
  }).filter(Boolean);
  return { rows, total, unpriced };
}

export function orderMessage({ rows, total, unpriced }, c) {
  const lines = rows.map((r, i) =>
    `${i + 1}. ${r.name} (${r.sizeLabel}) × ${r.qty} = ${r.price == null ? 'السعر يتحدد' : money(r.price * r.qty)}`);
  return [`طلب جديد من ${KITCHEN_NAME}`, '', ...lines, '',
    `الإجمالي: ${money(total)}${unpriced ? ' + أصناف سعرها يتحدد' : ''}`, '',
    `الاسم: ${c.name}`, `الموبايل: ${c.phone}`, `العنوان: ${c.address}`,
    c.date ? `يوم التسليم: ${c.date}` : '', c.notes ? `ملاحظات: ${c.notes}` : ''].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n').trim();
}
export const whatsappUrl = (number, text) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// Kitchen settings (WhatsApp number), stored next to the items.
export async function getSettings() {
  const def = { whatsapp: WHATSAPP_NUMBER };
  if (DEMO) return { ...def, ...ls.get('settings', {}) };
  const { fs, db } = await firebase();
  const d = await fs.getDoc(fs.doc(db, 'settings', 'main'));
  return { ...def, ...(d.exists() ? d.data() : {}) };
}
export async function saveSettings(s) {
  if (DEMO) return ls.set('settings', s);
  const { fs, db } = await firebase();
  await fs.setDoc(fs.doc(db, 'settings', 'main'), s);
}
// Accepts 010..., +20 10..., 0020..., spaces/dashes; returns 2010... or null.
export function normalizePhone(v) {
  let d = String(v).replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '20' + d.slice(1);
  return /^\d{10,15}$/.test(d) ? d : null;
}

// Resize a picked photo so it fits inside a Firestore doc (1MB max).
export function resizeImage(file, max = 700) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = img.width * k; c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); ok(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => fail(new Error('الصورة دي مش مدعومة'));
    img.src = URL.createObjectURL(file);
  });
}
