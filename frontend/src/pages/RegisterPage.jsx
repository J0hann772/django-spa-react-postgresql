import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        display_name: '',
        password: '',
        re_password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.re_password) {
            alert("Пароли не совпадают!");
            return;
        }

        try {
            // 1. Создание
            await api.post('/api/auth/users/', {
                email: formData.email,
                username: formData.email,
                password: formData.password,
                re_password: formData.re_password,
                display_name: formData.display_name // Бэкенд теперь примет это поле
            });

            // 2. Вход
            const loginRes = await api.post('/api/auth/jwt/create/', {
                email: formData.email,
                password: formData.password
            });

            const token = loginRes.data.access;
            localStorage.setItem('authTokens', JSON.stringify(loginRes.data));
            localStorage.setItem('access', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 3. Установка имени (для надежности)
            await api.patch('/api/auth/users/me/', { display_name: formData.display_name });

            window.location.href = '/';
        } catch (err) {
            alert("Ошибка: " + JSON.stringify(err.response?.data));
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial' }}>
            <h2>📝 Регистрация</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ padding: '10px' }} />
                <input type="text" name="display_name" placeholder="Отображаемое имя" value={formData.display_name} onChange={handleChange} required style={{ padding: '10px', border: '2px solid #3498db', borderRadius: '4px' }} />
                <input type="password" name="password" placeholder="Пароль" value={formData.password} onChange={handleChange} required style={{ padding: '10px' }} />
                <input type="password" name="re_password" placeholder="Повторите пароль" value={formData.re_password} onChange={handleChange} required style={{ padding: '10px' }} />
                <button type="submit" style={{ padding: '10px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Начать работу</button>
            </form>
            <div style={{ marginTop: '20px' }}>
                <Link to="/login" style={{ color: '#2980b9' }}>Войти</Link> | <Link to="/" style={{ color: '#7f8c8d' }}>На главную</Link>
            </div>
        </div>
    );
};

export default RegisterPage;