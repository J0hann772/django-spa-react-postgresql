import React, { useState } from 'react';
import api from '../api/client';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css'; // Используем тот же стиль

const RegisterPage = () => {
    const [formData, setFormData] = useState({ email: '', username: '', password: '', re_password: '' });
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (formData.password !== formData.re_password) { alert("Пароли не совпадают"); return; }
        try {
            await api.post('/api/auth/users/', formData);
            alert("Регистрация успешна! Теперь войдите.");
            navigate('/login');
        } catch (err) {
            console.error(err.response.data);
            alert("Ошибка регистрации. Проверьте данные.");
        }
    };

    return (
        <div className={styles.centeredContainer}>
            <div className={styles.authCard} style={{maxWidth: '500px'}}>
                <h2 className={styles.title}>Регистрация</h2>
                <form onSubmit={onSubmit}>
                    <div className={styles.formStack}>
                        <input type="email" name="email" placeholder="Email*" required onChange={onChange} className="global-input" />
                        <input type="text" name="username" placeholder="Username*" required onChange={onChange} className="global-input" />
                        <input type="password" name="password" placeholder="Пароль*" required onChange={onChange} className="global-input" />
                        <input type="password" name="re_password" placeholder="Повтор пароля*" required onChange={onChange} className="global-input" />
                    </div>
                    <button type="submit" className={`${styles.submitBtn} global-btn btn-primary`}>Создать аккаунт</button>
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