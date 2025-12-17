import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // Импортируем Link
import AuthContext from '../context/AuthContext';

const LoginPage = () => {
    let { loginUser } = useContext(AuthContext);

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial' }}>
            <h2>🔐 Вход в систему</h2>
            <form onSubmit={loginUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="email" name="email" placeholder="Введите Email" required style={{ padding: '10px' }} />
                <input type="password" name="password" placeholder="Введите пароль" required style={{ padding: '10px' }} />
                <button type="submit" style={{ padding: '10px', cursor: 'pointer', background: '#2980b9', color: 'white', border: 'none', fontWeight: 'bold' }}>Войти</button>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                <Link to="/register" style={{ color: '#27ae60' }}>Нет аккаунта? Регистрация</Link>
                <Link to="/" style={{ color: '#7f8c8d', textDecoration: 'none' }}>← На главную</Link>
            </div>
        </div>
    );
};

export default LoginPage;