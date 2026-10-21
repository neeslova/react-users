import { Circle, CircleCheckBig, ListTodo } from 'lucide-react';
import { getUserTodos } from '@/server/users';
import { EmptyState } from '../ui/EmptyState';

/** Async Server Component, стримится отдельно от постов в своём <Suspense> */
export async function UserTodos({ userId }: { userId: number }) {
  const todos = await getUserTodos(userId);
  const done = todos.filter((todo) => todo.completed).length;

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <h2 className="card-title text-base">
          <ListTodo size={18} aria-hidden /> Задачи
          {todos.length > 0 && (
            <span className="badge badge-ghost badge-sm">
              {done} из {todos.length}
            </span>
          )}
        </h2>

        {todos.length === 0 ? (
          <EmptyState compact icon={ListTodo} title="Задач нет" description="У пользователя нет задач в DummyJSON." />
        ) : (
          <ul className="flex flex-col gap-2">
            {todos.map((todo) => (
              <li key={todo.id} className="flex items-start gap-2 text-sm">
                {todo.completed ? (
                  <CircleCheckBig size={16} className="mt-0.5 shrink-0 text-success" aria-label="Выполнена" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 opacity-40" aria-label="Не выполнена" />
                )}
                <span className={todo.completed ? 'line-through opacity-60' : ''}>{todo.todo}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
