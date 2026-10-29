# مطبخ لولي

تطبيق موبايل (PWA) لمطبخ بيتي: الزبون يختار من المنيو ويحط في السلة، والطلب كله بيتبعت رسالة واتساب.

- `index.html`: صفحة الزبون (المنيو، السلة، بياناتي)
- `admin.html`: لوحة التحكم (إضافة وتعديل وحذف وإخفاء الأصناف)
- `config.js`: اسم المطبخ ورقم الواتساب وإعدادات Firebase

## تشغيله على جهازك
```bash
python3 -m http.server 8000
```
وافتح http://localhost:8000. من غير Firebase التطبيق بيشتغل "وضع تجربة" والأصناف بتتحفظ على الجهاز ده بس.

## تشغيله أونلاين (Firebase، مجاني)
1. اعمل مشروع على https://console.firebase.google.com
2. فعّل **Firestore Database** و**Authentication > Email/Password**، وضيف حسابك (إيميل وباسورد) من Users.
3. من Project settings > Your apps اعمل Web app وانسخ الـ config في `FIREBASE_CONFIG` جوه `config.js`.
4. انسخ محتوى `firestore.rules` في Firestore > Rules وحط إيميلك مكان `ADMIN_EMAIL_HERE`.
5. ارفع الملفات على Firebase Hosting أو GitHub Pages.
6. ادخل `admin.html` بإيميلك واضغط "ضيف الأصناف الجاهزة".

## اختبار
```bash
node test.mjs
```
