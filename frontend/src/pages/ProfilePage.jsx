import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthContext from '../context/AuthContext';

const ProfilePage = () => {
    const [displayName, setDisplayName] = useState("");
    const { logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // При загрузке пробуем узнать текущее имя (если оно уже есть)
    useEffect(() => {
        api.get('/api/auth/users/me/')
            .then(res => {
                if (res.data.display_name) {
                    setDisplayName(res.data.display_name);
                }
            })
            .catch(err => console.error("Ошибка загрузки профиля", err));
    }, []);

    const updateProfile = async (e) => {
        e.preventDefault();
        try {
            // Отправляем PATCH запрос (обновление части данных)
            await api.patch('/api/auth/users/me/', {
                display_name: displayName
            });
            alert("Профиль обновлен! Теперь вы можете создавать комнаты.");
            navigate('/'); // Возвращаем на главную
        } catch (error) {
            alert("Ошибка обновления: " + JSON.stringify(error.response.data));
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
            <h2>👤 Настройка профиля</h2>
            <p style={{ color: '#666' }}>
                Чтобы создавать комнаты, вы должны установить уникальное отображаемое имя.
            </p>

            <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label>Отображаемое имя:</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Например: MasterOfVotes"
                        required
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ddd' }}
                    />
                </div>

                <button type="submit" style={{ padding: '10px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Сохранить
                </button>
            </form>

            <hr style={{ margin: '20px 0' }} />
            <button onClick={logoutUser} style={{ background: 'transparent', color: 'red', border: 'none', cursor: 'pointer' }}>
                Выйти из аккаунта
            </button>
        </div>
    );
};

export default ProfilePage;