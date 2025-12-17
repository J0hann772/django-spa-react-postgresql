import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
    let [user, setUser] = useState(null);
    let [authTokens, setAuthTokens] = useState(null);
    let [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // Функция входа (получаем токены от Django)
    let loginUser = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/jwt/create/', {
                email: e.target.email.value,
                password: e.target.password.value
            });

            if (response.status === 200) {
                setAuthTokens(response.data);
                setUser(jwtDecode(response.data.access));
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                localStorage.setItem('access', response.data.access); // Для axios
                navigate('/'); // Переадресация на главную
            } else {
                alert('Что-то пошло не так!');
            }
        } catch (error) {
            alert("Неверный логин или пароль!");
        }
    };

    // Функция выхода (чистим память)
    let logoutUser = () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        localStorage.removeItem('access');
        navigate('/login');
    };

    // При первой загрузке сайта проверяем, есть ли токены в хранилище
    useEffect(() => {
        let storedTokens = localStorage.getItem('authTokens');
        if (storedTokens) {
            let tokens = JSON.parse(storedTokens);
            setAuthTokens(tokens);
            setUser(jwtDecode(tokens.access));
        }
        setLoading(false);
    }, []);

    let contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? null : children}
        </AuthContext.Provider>
    );
};