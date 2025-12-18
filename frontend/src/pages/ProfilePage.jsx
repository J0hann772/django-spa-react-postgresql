import React, { useState, useEffect, useContext } from 'react';
import api from '../api/client';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import styles from './Auth.module.css'; // И здесь тот же стиль карточки

const ProfilePage = () => {
    let { user } = useContext(AuthContext);
    const [displayName, setDisplayName] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if(user) {
            api.get('/api/auth/users/me/').then(r => setDisplayName(r.data.display_name || ""));
        }
    }, [user]);

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.patch('/api/auth/users/me/', { display_name: displayName });
            setMsg("Профиль обновлен! ✅");
        } catch { setMsg("Ошибка обновления ❌"); }
    };

    return (
        <div className={styles.centeredContainer} style={{alignItems: 'flex-start', paddingTop: '60px'}}>
             <div className={styles.authCard} style={{textAlign: 'left'}}>
                <div style={{marginBottom: '20px'}}>
                     <Link to="/" className="global-btn btn-ghost" style={{paddingLeft: 0}}>← Назад на главную</Link>
                </div>
                <h2 className={styles.title}>Ваш профиль</h2>
                {user && <p className="text-muted" style={{marginBottom: '20px'}}>Email: {user.email}</p>}

                <form onSubmit={updateProfile}>
                    <div className={styles.formStack}>
                         <label htmlFor="nickname" style={{fontWeight: 600}}>Отображаемое имя (Nickname):</label>
                        <input
                            id="nickname"
                            type="text"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Как вас называть в комнатах?"
                            className="global-input"
                        />
                    </div>
                    <button type="submit" className="global-btn btn-primary">Сохранить изменения</button>
                </form>
                {msg && <p style={{marginTop: '15px', fontWeight: 500}}>{msg}</p>}
            </div>
        </div>
    );
};
export default ProfilePage;