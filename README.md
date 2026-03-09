# רשימת קניות — לקוח (React + Vite)

## מה לעשות עכשיו

### 1. הוסף את מפתחות Supabase

- בתיקיית `client` צור קובץ בשם **`.env`** (בלי .txt).
- העתק את התוכן מ-`.env.example` והדבק ב-`.env`.
- הדבק ב-`.env` את **Project URL** ואת **anon key** מלוח הבקרה של Supabase (Project Settings → API).

דוגמה:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 2. צור משתמש (פעם אחת)

- ב-Supabase: **Authentication** → **Users** → **Add user** → **Create new user**.
- הזן אימייל וסיסמה (אותם תשתמשו בשני המכשירים — חשבון משותף).

### 3. הרצת הפרויקט

בטרמינל, מתוך תיקיית `client`:

```bash
npm install
npm run dev
```

אחרי שהשרת עולה, פתח בדפדפן את הכתובת שמופיעה (בדרך כלל http://localhost:5173). התחבר עם האימייל והסיסמה שיצרת.

---

בשלב הבא נוסיף את תצוגת הרשימה, סנכרון בזמן אמת ומצב סופרמרקט.
