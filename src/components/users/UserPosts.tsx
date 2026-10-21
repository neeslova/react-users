import { Eye, FileText, ThumbsDown, ThumbsUp } from 'lucide-react';
import { getUserPosts } from '@/server/users';
import { EmptyState } from '../ui/EmptyState';

/**
 * Async Server Component: сам загружает данные (без useEffect и API-запроса
 * из браузера). На странице обёрнут в <Suspense> — посты подгружаются потоком
 * (streaming) и не задерживают остальной профиль.
 */
export async function UserPosts({ userId }: { userId: number }) {
  const posts = await getUserPosts(userId);

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <h2 className="card-title text-base">
          <FileText size={18} aria-hidden /> Посты <span className="badge badge-ghost badge-sm">{posts.length}</span>
        </h2>

        {posts.length === 0 ? (
          <EmptyState compact icon={FileText} title="Постов пока нет" description="Пользователь ещё ничего не опубликовал." />
        ) : (
          <ul className="flex flex-col divide-y divide-base-300">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <h3 className="font-medium">{post.title}</h3>
                <p className="line-clamp-3 text-sm opacity-70">{post.body}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs opacity-70">
                  <span className="flex items-center gap-1" title="Нравится">
                    <ThumbsUp size={13} aria-hidden /> {post.likes}
                  </span>
                  <span className="flex items-center gap-1" title="Не нравится">
                    <ThumbsDown size={13} aria-hidden /> {post.dislikes}
                  </span>
                  <span className="flex items-center gap-1" title="Просмотры">
                    <Eye size={13} aria-hidden /> {post.views}
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span key={tag} className="badge badge-ghost badge-xs">
                        #{tag}
                      </span>
                    ))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
