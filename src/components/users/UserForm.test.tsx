import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UserInput } from '@/schemas/user';
import type { MutationResult } from '@/types/api';
import { makeUser } from '@/test/fixtures';
import { UserForm } from './UserForm';

type SubmitHandler = (input: UserInput) => Promise<MutationResult<unknown>>;

function setup(props: { initialUser?: Parameters<typeof UserForm>[0]['initialUser']; takenUsernames?: Set<string> } = {}) {
  const onSubmit = vi.fn<SubmitHandler>().mockResolvedValue({ ok: true, data: null });
  const onCancel = vi.fn();
  render(
    <UserForm
      initialUser={props.initialUser ?? null}
      onSubmit={onSubmit}
      onCancel={onCancel}
      takenUsernames={props.takenUsernames}
    />,
  );
  return { user: userEvent.setup(), onSubmit, onCancel };
}

/** Поле по подписи (у обязательных полей в подписи ещё «*») */
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field('Имя'), '  Иван ');
  await user.type(field('Фамилия'), 'Петров');
  await user.type(field('Логин'), 'Ivan.Petrov');
  await user.type(field('Email'), 'ivan@example.ru');
  await user.type(field('Возраст'), '30');
}

describe('UserForm', () => {
  it('при пустой отправке показывает сообщения Zod рядом с полями и не вызывает onSubmit', async () => {
    const { user, onSubmit } = setup();

    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(field('Имя')).toHaveAccessibleDescription('Введите имя');
    expect(field('Фамилия')).toHaveAccessibleDescription('Введите фамилию');
    expect(field('Email')).toHaveAccessibleDescription('Введите email');
    expect(field('Возраст')).toHaveAccessibleDescription('Возраст от 1 до 120');
    expect(field('Имя')).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('показывает сообщения о неверном формате email, логина и телефона', async () => {
    const { user, onSubmit } = setup();

    await user.type(field('Логин'), 'я');
    await user.type(field('Email'), 'ivan@example');
    await user.type(field('Телефон'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByText('Некорректный email')).toBeInTheDocument();
    expect(screen.getByText('Латиница, цифры, . _ - (от 3 до 20 символов)')).toBeInTheDocument();
    expect(screen.getByText('Телефон: цифры, пробелы, скобки и дефисы, в начале можно +')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('проверяет правило предметной области: администратор — только с 18 лет', async () => {
    const { user, onSubmit } = setup();

    await fillValidForm(user);
    await user.clear(field('Возраст'));
    await user.type(field('Возраст'), '16');
    await user.selectOptions(field('Роль'), 'Администратор');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(field('Возраст')).toHaveAccessibleDescription('Администратором может быть только совершеннолетний (от 18 лет)');
    expect(onSubmit).not.toHaveBeenCalled();

    // Ошибка исчезает, как только данные исправлены
    await user.selectOptions(field('Роль'), 'Пользователь');
    expect(screen.queryByText(/только совершеннолетний/)).not.toBeInTheDocument();
  });

  it('при корректном вводе вызывает onSubmit с данными, приведёнными схемой', async () => {
    const { user, onSubmit } = setup();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Иван', // пробелы обрезаны
        lastName: 'Петров',
        username: 'ivan.petrov', // логин в нижнем регистре
        email: 'ivan@example.ru',
        age: 30, // строка из поля → число
        role: 'user',
      }),
    );
  });

  it('показывает ошибки, которые вернул сервер, и убирает их при исправлении поля', async () => {
    const { user, onSubmit } = setup();
    onSubmit.mockResolvedValueOnce({
      ok: false,
      status: 409,
      message: 'Такой логин уже занят',
      fieldErrors: { username: 'Такой логин уже занят' },
    });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Такой логин уже занят');
    expect(field('Логин')).toHaveAccessibleDescription('Такой логин уже занят');

    await user.type(field('Логин'), '2');
    expect(field('Логин')).not.toHaveAccessibleDescription('Такой логин уже занят');
  });

  it('не даёт занять логин локальной записи (о ней сервер не знает)', async () => {
    const { user, onSubmit } = setup({ takenUsernames: new Set(['ivan.petrov']) });

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(field('Логин')).toHaveAccessibleDescription('Такой логин уже занят');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('пока идёт отправка, блокирует поля и кнопки', async () => {
    const { user, onSubmit } = setup();
    let finish!: (result: MutationResult<unknown>) => void;
    onSubmit.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(screen.getByRole('button', { name: 'Сохранение…' })).toBeDisabled();
    expect(field('Имя')).toBeDisabled();

    finish({ ok: true, data: null });
    expect(await screen.findByRole('button', { name: 'Добавить' })).toBeEnabled();
  });

  it('в режиме изменения заполнена данными записи; «Отмена» вызывает onCancel', async () => {
    const { user, onCancel } = setup({ initialUser: makeUser() });

    expect(field('Имя')).toHaveValue('Ольга');
    expect(field('Логин')).toHaveValue('olga.m');
    expect(field('Возраст')).toHaveValue(31);
    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
