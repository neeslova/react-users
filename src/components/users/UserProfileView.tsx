import type { ReactNode } from 'react';
import { Briefcase, Contact, GraduationCap, UserRound, type LucideIcon } from 'lucide-react';
import { GENDER_LABELS } from '@/constants/user';
import type { User } from '@/types/user';
import { formatAge, formatBirthDate, formatMeasure } from '@/utils/format';
import type { LocalStatus } from '@/utils/localChanges';
import { getFullName } from '@/utils/userFilters';
import { LocalStatusBadge, RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

type InfoItem = [label: string, value: ReactNode];

function InfoSection({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: InfoItem[] }) {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-3">
        <h2 className="card-title text-base">
          <Icon size={18} aria-hidden /> {title}
        </h2>
        <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm">
          {items.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="opacity-60">{label}</dt>
              <dd className="min-w-0 break-words">{value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

interface UserProfileViewProps {
  user: User;
  status: LocalStatus;
  actions?: ReactNode;
}

/** Профиль пользователя — презентационный компонент без состояния */
export function UserProfileView({ user, status, actions }: UserProfileViewProps) {
  const { address, company, hair } = user;
  const fullAddress = [address.address, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <section className="card border border-base-300 bg-base-100">
        <div className="card-body flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
          <UserAvatar key={user.image} user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold break-words">{getFullName(user)}</h1>
            <p className="opacity-60">
              @{user.username} · {formatAge(user.age)}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <RoleBadge role={user.role} />
              <LocalStatusBadge status={status} />
            </div>
          </div>
          {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
        </div>
      </section>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <InfoSection
          title="Личные данные"
          icon={UserRound}
          items={[
            ['Пол', GENDER_LABELS[user.gender]],
            ['Дата рождения', user.birthDate && formatBirthDate(user.birthDate)],
            ['Девичья фамилия', user.maidenName],
            ['Группа крови', user.bloodGroup],
            ['Рост', user.height && formatMeasure(user.height, 'см')],
            ['Вес', user.weight && formatMeasure(user.weight, 'кг')],
            ['Цвет глаз', user.eyeColor],
            ['Волосы', [hair.color, hair.type].filter(Boolean).join(', ')],
          ]}
        />
        <InfoSection
          title="Контакты"
          icon={Contact}
          items={[
            [
              'Email',
              <a key="email" className="link link-hover" href={`mailto:${user.email}`}>
                {user.email}
              </a>,
            ],
            [
              'Телефон',
              user.phone && (
                <a key="phone" className="link link-hover" href={`tel:${user.phone.replace(/[^\d+]/g, '')}`}>
                  {user.phone}
                </a>
              ),
            ],
            ['Адрес', fullAddress],
          ]}
        />
        <InfoSection
          title="Работа"
          icon={Briefcase}
          items={[
            ['Компания', company.name],
            ['Должность', company.title],
            ['Отдел', company.department],
          ]}
        />
        <InfoSection title="Образование" icon={GraduationCap} items={[['Университет', user.university]]} />
      </div>
    </>
  );
}
