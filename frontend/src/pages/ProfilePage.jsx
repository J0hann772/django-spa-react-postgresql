import React, { useState, useContext, useEffect } from 'react';
import api from '../api/client';
import AuthContext from '../context/AuthContext';

const ProfilePage = () => {
    const [displayName, setDisplayName] = useState("");
    const { logoutUser } = useContext(AuthContext);

    useEffect(() => {
        api.get('/api/auth/users/me/')
            .then(res => {
                if (res.data.display_name) setDisplayName(res.data.display_name);
            })
            .catch(err => console.error(err));
    }, []);

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            await api.patch('/api/auth/users/me/', { display_name: displayName });
            alert("Профиль обновлен!");
            window.location.href = '/';
        } catch (error) {
            alert("Ошибка: " + JSON.stringify(error.response?.data));
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', fontFamily: 'Arial' }}>
            <h2>👤 Настройка профиля</h2>
            <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label>Ваш nickname:</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Введите ник..."
                        required
                        style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Сохранить изменения
                </button>
            </form>
            <hr style={{ margin: '20px 0' }} />
            <button onClick={logoutUser} style={{ background: 'none', color: 'red', border: 'none', cursor: 'pointer' }}>Выйти из аккаунта</button>
        </div>
    );
};

export default ProfilePage;