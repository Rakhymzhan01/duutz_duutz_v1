import React, { useEffect, useMemo, useState } from 'react';

type AdminTab = 'users' | 'content';

type ContentSection = 'information' | 'news' | 'blog' | 'instruction' | 'payment';

type ContentLang = 'en' | 'ru' | 'kz' | 'ar';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
};

type Post = {
  id: string;
  section: ContentSection;
  lang: ContentLang;
  title: string;
  body: string;
  imageDataUrl?: string; // preview + store locally
  createdAt: number;
  updatedAt: number;
};

const LS_POSTS_KEY = 'duutz_admin_posts_v1';
const LS_USERS_KEY = 'duutz_admin_users_v1';

const sectionLabel: Record<ContentSection, string> = {
  information: 'Information',
  news: 'News',
  blog: 'Blog',
  instruction: 'Instruction',
  payment: 'Payment',
};

const langLabel: Record<ContentLang, string> = {
  en: 'English',
  ru: 'Русский',
  kz: 'Қазақша',
  ar: 'العربية',
};

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function truncate(s: string, n = 120) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('content');

  // ----- Users (mock now) -----
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userQuery, setUserQuery] = useState('');

  // ----- Content -----
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeSection, setActiveSection] = useState<ContentSection>('news');
  const [activeLang, setActiveLang] = useState<ContentLang>('en');

  // form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // load from localStorage
  useEffect(() => {
    const savedPosts = safeJsonParse<Post[]>(localStorage.getItem(LS_POSTS_KEY), []);
    const savedUsers = safeJsonParse<UserRow[]>(localStorage.getItem(LS_USERS_KEY), []);

    setPosts(Array.isArray(savedPosts) ? savedPosts : []);

    // seed users if empty
    if (Array.isArray(savedUsers) && savedUsers.length > 0) {
      setUsers(savedUsers);
    } else {
      const seed: UserRow[] = [
        { id: uid('u'), name: 'Aibaty B', email: 'aibaty@example.com', role: 'admin', status: 'active' },
        { id: uid('u'), name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active' },
        { id: uid('u'), name: 'Sara Ali', email: 'sara@example.com', role: 'user', status: 'blocked' },
      ];
      setUsers(seed);
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(seed));
    }
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(LS_POSTS_KEY, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
      );
    });
  }, [users, userQuery]);

  const visiblePosts = useMemo(() => {
    return posts
      .filter((p) => p.section === activeSection && p.lang === activeLang)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [posts, activeSection, activeLang]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setImageDataUrl(undefined);
  };

  const startEdit = (p: Post) => {
    setEditingId(p.id);
    setActiveSection(p.section);
    setActiveLang(p.lang);
    setTitle(p.title);
    setBody(p.body);
    setImageDataUrl(p.imageDataUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  };

  const onPickImage: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = f.type.startsWith('image/');
    if (!ok) return;
    const dataUrl = await fileToDataUrl(f);
    setImageDataUrl(dataUrl);
  };

  const savePost = async () => {
    if (!title.trim()) return;
    if (!body.trim()) return;

    setSaving(true);
    try {
      const now = Date.now();

      if (editingId) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  section: activeSection,
                  lang: activeLang,
                  title: title.trim(),
                  body: body.trim(),
                  imageDataUrl,
                  updatedAt: now,
                }
              : p
          )
        );
      } else {
        const newPost: Post = {
          id: uid('post'),
          section: activeSection,
          lang: activeLang,
          title: title.trim(),
          body: body.trim(),
          imageDataUrl,
          createdAt: now,
          updatedAt: now,
        };
        setPosts((prev) => [newPost, ...prev]);
      }

      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' }
          : u
      )
    );
  };

  return (
    <div className="w-full max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Admin Panel
        </h1>
        <p className="mt-2 text-purple-200">
          Manage users and edit site content (Information/News/Blog/Instruction/Payment).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab('content')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border
            ${tab === 'content'
              ? 'bg-white/15 text-white border-white/25'
              : 'bg-white/5 text-purple-200 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
        >
          Editor Panel
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border
            ${tab === 'users'
              ? 'bg-white/15 text-white border-white/25'
              : 'bg-white/5 text-purple-200 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
        >
          User Management
        </button>
      </div>

      {/* CONTENT TAB */}
      {tab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor form */}
          <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit content' : 'Add content'}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-sm text-purple-200 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-purple-200">Section</label>
                  <select
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value as ContentSection)}
                    className="mt-1 w-full bg-[#12083a] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="information">Information</option>
                    <option value="news">News</option>
                    <option value="blog">Blog</option>
                    <option value="instruction">Instruction</option>
                    <option value="payment">Payment</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-purple-200">Language</label>
                  <select
                    value={activeLang}
                    onChange={(e) => setActiveLang(e.target.value as ContentLang)}
                    className="mt-1 w-full bg-[#12083a] border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                    <option value="kz">Қазақша</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-purple-200">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title"
                  className="mt-1 w-full bg-[#12083a] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-sm text-purple-200">Text</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  placeholder="Write content text..."
                  className="mt-1 w-full bg-[#12083a] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="text-sm text-purple-200">Image (optional)</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPickImage}
                    className="block w-full text-sm text-purple-200
                      file:mr-4 file:py-2 file:px-3
                      file:rounded-lg file:border-0
                      file:bg-white/10 file:text-white
                      hover:file:bg-white/15"
                  />
                </div>

                {imageDataUrl && (
                  <div className="mt-3 relative">
                    <img
                      src={imageDataUrl}
                      alt="Preview"
                      className="w-full max-h-56 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      onClick={() => setImageDataUrl(undefined)}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={savePost}
                disabled={saving || !title.trim() || !body.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold py-2.5 rounded-lg
                  hover:from-purple-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Publish'}
              </button>

              <p className="text-xs text-purple-200/80">
                Сейчас данные сохраняются в браузере (localStorage). Позже подключим бэк и базу.
              </p>
            </div>
          </div>

          {/* Content list */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Content</h2>
                <p className="text-sm text-purple-200">
                  {sectionLabel[activeSection]} • {langLabel[activeLang]} • {visiblePosts.length} items
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSection('information')}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Information
                </button>
                <button
                  onClick={() => setActiveSection('news')}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  News
                </button>
                <button
                  onClick={() => setActiveSection('blog')}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Blog
                </button>
                <button
                  onClick={() => setActiveSection('instruction')}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Instruction
                </button>
                <button
                  onClick={() => setActiveSection('payment')}
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Payment
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-purple-200">Lang:</span>
              {(['en', 'ru', 'kz', 'ar'] as ContentLang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all
                    ${activeLang === l
                      ? 'bg-white/15 text-white border-white/25'
                      : 'bg-white/5 text-purple-200 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {langLabel[l]}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {visiblePosts.length === 0 ? (
                <div className="text-purple-200">
                  No content yet for this section/language. Add something on the left.
                </div>
              ) : (
                visiblePosts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-black/20 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">
                            {sectionLabel[p.section]}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-white/10 border border-white/10">
                            {langLabel[p.lang]}
                          </span>
                          <span className="text-xs text-purple-200/80">
                            {new Date(p.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold break-words">{p.title}</h3>
                        <p className="mt-1 text-sm text-purple-100/90 break-words">
                          {truncate(p.body, 160)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="px-3 py-2 rounded-lg text-xs bg-white/10 hover:bg-white/15 border border-white/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removePost(p.id)}
                          className="px-3 py-2 rounded-lg text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {p.imageDataUrl && (
                      <div className="mt-3">
                        <img
                          src={p.imageDataUrl}
                          alt="Post"
                          className="w-full max-h-64 object-cover rounded-xl border border-white/10"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">User Management</h2>
              <p className="text-sm text-purple-200">
                Пока mock UI. Потом подключим API /admin/users.
              </p>
            </div>

            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search by name, email, role, status..."
              className="w-full md:w-96 bg-[#12083a] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40"
            />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-purple-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-white/10">
                    <td className="py-3 pr-4 text-white">{u.name}</td>
                    <td className="py-3 pr-4 text-purple-100/90">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded bg-white/10 border border-white/10">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-1 rounded border ${
                          u.status === 'active'
                            ? 'bg-green-500/15 border-green-400/20 text-green-200'
                            : 'bg-red-500/15 border-red-400/20 text-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleBlock(u.id)}
                        className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                          u.status === 'active'
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200 border-red-500/30'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-200 border-green-500/30'
                        }`}
                      >
                        {u.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-purple-200">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
