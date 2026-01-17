import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contentApi, ContentItem } from '../services/contentApi';

type PublicSection = 'information' | 'news' | 'blog' | 'instruction' | 'payment';

interface Props {
  section: PublicSection;
  title: string;
}

const ContentSectionPage: React.FC<Props> = ({ section, title }) => {
  const { i18n } = useTranslation();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Определяем язык для контента: en / ar
  const lang: 'en' | 'ar' = i18n.language.startsWith('ar') ? 'ar' : 'en';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await contentApi.list(section, lang);

        if (!cancelled) {
          setItems(data);
        }
      } catch (e) {
        console.error('Failed to load public content', e);
        if (!cancelled) {
          setError('Failed to load content. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [section, lang]);

  const formatDate = (item: ContentItem) => {
    const raw = (item.updated_at as any) || (item.created_at as any);
    if (!raw) return '';

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '';

    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">{title}</h1>

      {loading && !items.length && (
        <p className="text-purple-200">Loading content...</p>
      )}

      {error && <p className="text-red-300 mb-4">{error}</p>}

      {!loading && !items.length && !error && (
        <p className="text-purple-200">No content has been published in this section yet.</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm overflow-hidden"
          >
            <header className="mb-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
              <h2 className="text-xl font-semibold break-words [overflow-wrap:anywhere]">
                {item.title}
              </h2>
              {formatDate(item) && (
                <span className="text-xs text-purple-300 whitespace-nowrap">
                  {formatDate(item)}
                </span>
              )}
            </header>

            {item.image_data_url && (
              <div className="mb-3">
                {/* Контейнер с фикс. высотой, чтобы картинка вписывалась полностью */}
                <div className="w-full h-64 sm:h-72 bg-black/10 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={item.image_data_url}
                    alt={item.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            <p className="text-purple-100 whitespace-pre-line leading-relaxed break-words [overflow-wrap:anywhere]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ContentSectionPage;
