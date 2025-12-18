import React, { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css'; // Импортируем новый стиль

const LoginPage = () => {
    let { loginUser } = useContext(AuthContext);

    return (
        <div className={styles.centeredContainer}>
            <div className={styles.authCard}>
                <h2 className={styles.title}>Вход в систему</h2>
                <form onSubmit={loginUser}>
                    <div className={styles.formStack}>
                        <input type="email" name="email" placeholder="Email" required className="global-input" />
                        <input type="password" name="password" placeholder="Пароль" required className="global-input" />
                    </div>
                    <button type="submit" className={`${styles.submitBtn} global-btn btn-primary`}>Войти</button>
                </form>
                <p className={styles.footerLink}>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>
                <div style={{marginTop: '20px'}}>
                     <Link to="/" className="global-btn btn-ghost">← На главную</Link>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;