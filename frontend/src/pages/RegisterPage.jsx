import React, { useState } from 'react';
import api from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        display_name: '',
        password: '',
        re_password: ''
    });

    // Состояние для блокировки кнопки (чтобы не нажали дважды)
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();

        if (formData.password !== formData.re_password) {
            alert("Пароли не совпадают");
            return;
        }

        setIsLoading(true);

        // Django требует username, копируем туда email
        const dataToSend = {
            ...formData,
            username: formData.email
        };

        try {
            // 1. ШАГ: Регистрация
            await api.post('/api/auth/users/', dataToSend);

            // 2. ШАГ: Автоматический вход (получение токенов)
            // Мы используем те же данные, что пользователь только что ввел
            const loginResponse = await api.post('/api/auth/jwt/create/', {
                email: formData.email,
                password: formData.password
            });

            // 3. ШАГ: Сохранение токенов
            localStorage.setItem('access', loginResponse.data.access);
            localStorage.setItem('refresh', loginResponse.data.refresh);

            // 4. ШАГ: Переадресация
            // Используем window.location.href вместо navigate, чтобы перезагрузить приложение.
            // Это гарантирует, что AuthContext заново считает токены и сразу покажет, что мы залогинены.
            window.location.href = '/';

        } catch (err) {
            console.error(err.response?.data);
            const errorData = err.response?.data;
            let msg = "Ошибка регистрации.";

            if (errorData) {
                if (errorData.password) msg = `Пароль: ${errorData.password[0]}`;
                else if (errorData.email) msg = `Email: ${errorData.email[0]}`;
                else if (errorData.display_name) msg = `Ник: ${errorData.display_name[0]}`;
                // Если ошибка пришла уже на этапе авто-логина
                else if (errorData.detail) msg = errorData.detail;
            }
            alert(msg);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.centeredContainer}>
            <div className={styles.authCard} style={{maxWidth: '500px'}}>
                <h2 className={styles.title}>Регистрация</h2>
                <form onSubmit={onSubmit}>
                    <div className={styles.formStack}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email (будет логином)*"
                            required
                            onChange={onChange}
                            className="global-input"
                        />
                        <input
                            type="text"
                            name="display_name"
                            placeholder="Ваш Никнейм (виден всем)*"
                            required
                            onChange={onChange}
                            className="global-input"
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Пароль*"
                            required
                            onChange={onChange}
                            className="global-input"
                        />
                        <input
                            type="password"
                            name="re_password"
                            placeholder="Повтор пароля*"
                            required
                            onChange={onChange}
                            className="global-input"
                        />
                    </div>

                    <button
                        type="submit"
                        className={`${styles.submitBtn} global-btn btn-primary`}
                        disabled={isLoading} // Блокируем кнопку при загрузке
                    >
                        {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
                    </button>
                </form>

                <p className={styles.footerLink}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
                 <div style={{marginTop: '20px'}}>
                     <Link to="/" className="global-btn btn-ghost">← На главную</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;