import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { contentApi, ContentItem } from '../services/contentApi';

type PublicSection = 'information' | 'news' | 'blog' | 'instruction' | 'payment';

interface Props {
  section: PublicSection;
  title: string;
}

// конвертация обычной YouTube-ссылки в embed-URL
function getYoutubeEmbedUrl(raw: string): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw.trim());

    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (url.pathname.startsWith('/embed/')) return url.toString();
    }

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }

  return null;
}

const ContentSectionPage: React.FC<Props> = ({ section, title }) => {
  const { i18n } = useTranslation();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // язык контента: en / ar
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
    const raw: any = item.updated_at || item.created_at;
    if (!raw) return '';

    const d =
      typeof raw === 'number'
        ? new Date(raw * 1000)
        : new Date(raw);

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
        <p className="text-purple-200">
          No content has been published in this section yet.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const embedUrl = item.video_url
            ? getYoutubeEmbedUrl(item.video_url)
            : null;

          return (
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

              {/* ВИДЕО, если есть */}
              {item.video_url && (
                <div className="mb-3">
                  {embedUrl ? (
                    // YouTube-видео
                    <div className="w-full aspect-video bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                      <iframe
                        src={embedUrl}
                        title={item.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    // Обычный видеоплеер для прямого файла (твои сгенерённые видео)
                    <div className="w-full bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                      <video
                        controls
                        className="w-full max-h-80"
                        src={item.video_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )}

              {/* Картинка, если есть */}
              {item.image_data_url && (
                <div className="mb-3">
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
          );
        })}
      </div>
    </div>
  );
};

export default ContentSectionPage;
