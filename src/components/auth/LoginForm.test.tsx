import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LoginState } from '@/types/auth';
import { LoginForm } from './LoginForm';

type LoginAction = (state: LoginState, formData: FormData) => Promise<LoginState>;

function setup(result: LoginState = {}) {
  const action = vi.fn<LoginAction>().mockResolvedValue(result);
  render(<LoginForm action={action} callbackUrl="/users/new" />);
  return { user: userEvent.setup(), action };
}

const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));
const submit = () => screen.getByRole('button', { name: 'Войти' });

describe('LoginForm', () => {
  it('при пустых полях показывает сообщения Zod и не отправляет форму', async () => {
    const { user, action } = setup();

    await user.click(submit());

    expect(field('Логин')).toHaveAccessibleDescription('Введите логин');
    expect(field('Пароль')).toHaveAccessibleDescription('Введите пароль');
    expect(action).not.toHaveBeenCalled();
  });

  it('при корректном вводе вызывает Server Function с данными формы', async () => {
    const { user, action } = setup();

    await user.type(field('Логин'), 'emilys');
    await user.type(field('Пароль'), 'emilyspass');
    await user.click(submit());

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({
      username: 'emilys',
      password: 'emilyspass',
      callbackUrl: '/users/new',
    });
    // Пароль не остаётся в поле после отправки
    expect(field('Пароль')).toHaveValue('');
  });

  it('показывает ошибку, которую вернул сервер', async () => {
    const { user } = setup({ message: 'Неверный логин или пароль' });

    await user.type(field('Логин'), 'emilys');
    await user.type(field('Пароль'), 'wrong-password');
    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль');
    expect(field('Логин')).toHaveValue('emilys');
  });

  it('кнопка тестовой учётной записи подставляет логин и пароль', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /Администратор emilys/ }));

    expect(field('Логин')).toHaveValue('emilys');
    expect(field('Пароль')).toHaveValue('emilyspass');
  });
});
