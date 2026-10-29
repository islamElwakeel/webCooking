// node test.mjs  — checks cart totals and the WhatsApp message
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem() {} };
const { cartTotals, orderMessage } = await import('./app.js');
const items = [{ id: 'a', name: 'فتة', sizes: [{ label: 'نص كيلو', price: 500 }, { label: 'كيلو', price: 900 }] },
  { id: 'b', name: 'نجرسكو', sizes: [{ label: 'طبق', price: null }] }, { id: 'h', name: 'مخفي', hidden: true, sizes: [{ label: 'x', price: 1 }] }];
const t = cartTotals([{ id: 'a', size: 1, qty: 2 }, { id: 'b', size: 0, qty: 1 }, { id: 'h', size: 0, qty: 1 }, { id: 'gone', size: 0, qty: 1 }], items);
assert.equal(t.total, 1800); assert.equal(t.unpriced, 1); assert.equal(t.rows.length, 2);
const m = orderMessage(t, { name: 'سارة', phone: '010', address: 'مدينة نصر', date: '', notes: '' });
assert.match(m, /فتة \(كيلو\) × 2/); assert.match(m, /أصناف سعرها يتحدد/); assert.match(m, /العنوان: مدينة نصر/);
assert.doesNotMatch(m, /ملاحظات/);
console.log('ok');
